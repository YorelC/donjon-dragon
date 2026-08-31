import type { Ability } from '../reference/abilities';
import { CLASSES } from '../reference/classes';
import { WEAPONS, type Weapon } from '../reference/weapons';
import type { CharacterBuild } from './character-build';
import type { FormulaContext } from './evaluate-formula';

export interface ResolvedAttack {
  weaponKey: string;
  name: string;
  ability: Ability;
  attackBonus: number;
  damage: string;
  damageType: string;
  range: { normal: number; max: number } | null;
  proficient: boolean;
  mastery: boolean;
}

/** Ce qu'il faut savoir du personnage pour chiffrer une attaque, une fois. */
interface AttackInput {
  build: CharacterBuild;
  context: FormulaContext;
  masteries: ReadonlySet<string>;
}

export function resolveAttacks(
  build: CharacterBuild,
  context: FormulaContext,
): ResolvedAttack[] {
  const masteries = new Set(build.choices.all.flatMap((choice) => choice.weaponMasteries ?? []));
  const input: AttackInput = { build, context, masteries };
  return build.equipment.items.flatMap((item) => {
    const weapon = WEAPONS[item.itemKey];
    return weapon ? [attackOf(input, weapon)] : [];
  });
}

function attackOf(input: AttackInput, weapon: Weapon): ResolvedAttack {
  const { context } = input;
  const ability = attackAbility(weapon, context);
  const proficient = isProficient(input.build.classKey, weapon);
  const modifier = context.abilityModifiers[ability];
  return {
    weaponKey: weapon.key,
    name: weapon.name,
    ability,
    attackBonus: modifier + (proficient ? context.proficiencyBonus : 0),
    damage: damageExpression(weapon.damageDice, modifier),
    damageType: weapon.damageType,
    range: weapon.range ? { ...weapon.range } : null,
    proficient,
    mastery: input.masteries.has(weapon.key),
  };
}

function attackAbility(weapon: Weapon, context: FormulaContext): Ability {
  if (weapon.kind === 'ranged') return 'dexterity';
  if (!weapon.properties.includes('finesse')) return 'strength';
  return context.abilityModifiers.dexterity > context.abilityModifiers.strength
    ? 'dexterity'
    : 'strength';
}

function isProficient(classKey: CharacterBuild['classKey'], weapon: Weapon): boolean {
  const proficiencies = CLASSES[classKey].weaponProficiencies;
  if (proficiencies.includes(weapon.category)) return true;
  if (!proficiencies.includes('martialFinesseOrLight')) return false;
  return weapon.category === 'martial'
    && weapon.properties.some((property) => property === 'finesse' || property === 'light');
}

function damageExpression(dice: string, modifier: number): string {
  if (modifier === 0) return dice;
  return `${dice} ${modifier > 0 ? '+' : '-'} ${Math.abs(modifier)}`;
}
