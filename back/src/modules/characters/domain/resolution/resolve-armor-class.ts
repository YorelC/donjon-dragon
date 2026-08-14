import {
  ARMORS,
  CAPPED_DEXTERITY_LIMIT,
  SHIELD,
  UNARMORED_BASE_ARMOR_CLASS,
  type Armor,
  type DexterityAllowance,
} from '../reference/armors';
import type { CollectedEffect, PassiveEffect } from '../reference/effect';
import type { CharacterEquipment } from '../character-equipment';
import { evaluateFormula, type FormulaContext } from './evaluate-formula';

export interface ResolvedValue {
  value: number;
  sources: string[];
}

export interface ArmorClassInput {
  equipment: CharacterEquipment;
  effects: readonly CollectedEffect[];
  context: FormulaContext;
}

interface Candidate {
  value: number;
  source: string;
}

/**
 * La classe d'armure.
 *
 * Ce n'est pas un concours de priorité mais un filtre d'applicabilité : une
 * armure portée exclut toute Défense sans armure, et celle du moine s'éteint
 * en plus dès qu'un bouclier apparaît. Quand plusieurs formules restent
 * applicables — un moine barbare torse nu — on garde la plus haute, comme le
 * PHB le prescrit. Le bouclier et les bonus additifs s'ajoutent ensuite.
 */
export function resolveArmorClass(input: ArmorClassInput): ResolvedValue {
  const candidates = applicableCandidates(input);
  const best = candidates.reduce(highest);
  const bonus = additiveBonus(input);

  return {
    value: best.value + shieldBonus(input.equipment) + bonus.value,
    sources: [best.source, ...shieldSource(input.equipment), ...bonus.sources],
  };
}

function applicableCandidates(input: ArmorClassInput): Candidate[] {
  const worn = wornArmorCandidate(input);
  if (worn) return [worn];

  return [
    {
      value: UNARMORED_BASE_ARMOR_CLASS + input.context.abilityModifiers.dexterity,
      source: 'Sans armure',
    },
    ...unarmoredDefenseCandidates(input),
  ];
}

function wornArmorCandidate(input: ArmorClassInput): Candidate | null {
  const key = input.equipment.armorKey;
  if (key === null) return null;

  const armor = ARMORS[key];
  if (!armor) return null;

  return {
    value: armor.baseArmorClass + allowedDexterity(armor, input.context),
    source: armor.name,
  };
}

const DEXTERITY_CAPS: Record<DexterityAllowance, (modifier: number) => number> = {
  full: (modifier) => modifier,
  capped: (modifier) => Math.min(modifier, CAPPED_DEXTERITY_LIMIT),
  none: () => 0,
};

function allowedDexterity(armor: Armor, context: FormulaContext): number {
  return DEXTERITY_CAPS[armor.dexterityAllowance](context.abilityModifiers.dexterity);
}

function unarmoredDefenseCandidates(input: ArmorClassInput): Candidate[] {
  return input.effects.flatMap((collected) => {
    const passive = collected.effect.passive;
    if (!isApplicableSet(passive, input.equipment)) return [];

    return [
      {
        value: evaluateFormula(passive.formula, input.context),
        source: collected.feature,
      },
    ];
  });
}

type ApplicableSet = PassiveEffect & { formula: NonNullable<PassiveEffect['formula']> };

function isApplicableSet(
  passive: PassiveEffect | undefined,
  equipment: CharacterEquipment,
): passive is ApplicableSet {
  if (!passive?.formula) return false;
  if (passive.kind !== 'set' || passive.target !== 'armorClass') return false;

  return meetsArmorRequirement(passive, equipment);
}

/**
 * La condition d'armure d'un effet. Elle vaut pour les remplacements comme pour
 * les bonus : le Style de combat Défense n'ajoute son point de CA que si une
 * armure est portée, et un magicien qui le prendrait ne gagnerait rien.
 */
function meetsArmorRequirement(
  passive: PassiveEffect,
  equipment: CharacterEquipment,
): boolean {
  if (passive.requires === 'unarmored') return equipment.isUnarmored;
  if (passive.requires === 'unarmoredWithoutShield') {
    return equipment.isUnarmored && !equipment.shield;
  }
  if (passive.requires === 'armored') return !equipment.isUnarmored;

  return true;
}

function additiveBonus(input: ArmorClassInput): ResolvedValue {
  const bonuses = input.effects.flatMap((collected) => {
    const passive = collected.effect.passive;
    if (passive?.kind !== 'bonus' || passive.target !== 'armorClass') return [];
    if (!passive.formula) return [];
    if (!meetsArmorRequirement(passive, input.equipment)) return [];

    return [{ value: evaluateFormula(passive.formula, input.context), source: collected.feature }];
  });

  return {
    value: bonuses.reduce((total, bonus) => total + bonus.value, 0),
    sources: bonuses.map((bonus) => bonus.source),
  };
}

function shieldBonus(equipment: CharacterEquipment): number {
  return equipment.shield ? SHIELD.armorClassBonus : 0;
}

function shieldSource(equipment: CharacterEquipment): string[] {
  return equipment.shield ? [SHIELD.name] : [];
}

function highest(left: Candidate, right: Candidate): Candidate {
  return right.value > left.value ? right : left;
}
