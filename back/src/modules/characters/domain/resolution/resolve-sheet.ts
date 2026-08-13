import { proficiencyBonusAt, type Ability } from '../reference/abilities';
import { BACKGROUNDS } from '../reference/backgrounds';
import { CLASSES } from '../reference/classes';
import type { CreatureSize } from '../reference/proficiencies';
import { SPECIES } from '../reference/species';
import type { CharacterBuild } from './character-build';
import { collectEffects } from './collect-effects';
import type { FormulaContext } from './evaluate-formula';
import { modifiersOf, resolveAbilities, type ResolvedAbility } from './resolve-abilities';
import { resolveArmorClass, type ResolvedValue } from './resolve-armor-class';
import {
  resolveInitiative,
  resolveMaxHitPoints,
  resolveSpeed,
  type DerivedInput,
} from './resolve-derived-values';
import {
  resolveFeatures,
  resolveResources,
  resolveUnarmedDamage,
  type ResolvedFeature,
  type ResolvedResource,
} from './resolve-features';
import {
  resolveProficiencies,
  type ResolvedProficiencies,
} from './resolve-proficiencies';
import {
  passivePerceptionOf,
  resolveSavingThrows,
  resolveSkills,
  type ResolvedSavingThrow,
  type ResolvedSkill,
} from './resolve-skills';
import {
  resolveSpellcasting,
  type ResolvedSpellcasting,
} from './resolve-spellcasting';

/**
 * La fiche jouable. Rien de ce qu'elle contient n'est stocké : elle se
 * reconstruit à chaque lecture depuis les choix du joueur et les données de
 * référence. C'est le seul mouvement du moteur.
 */
export interface ComputedCharacter {
  level: number;
  proficiencyBonus: number;
  speciesName: string;
  lineageName: string | null;
  className: string;
  backgroundName: string;
  size: CreatureSize;
  darkvision: number;

  abilities: Record<Ability, ResolvedAbility>;
  maxHitPoints: ResolvedValue;
  armorClass: ResolvedValue;
  initiative: ResolvedValue;
  speed: ResolvedValue;
  passivePerception: number;
  unarmedDamage: string;

  savingThrows: Record<Ability, ResolvedSavingThrow>;
  skills: ResolvedSkill[];
  proficiencies: ResolvedProficiencies;
  spellcasting: ResolvedSpellcasting[];
  features: ResolvedFeature[];
  resources: ResolvedResource[];
}

export function resolveSheet(build: CharacterBuild): ComputedCharacter {
  const abilities = resolveAbilities(build.abilities);
  const context = contextFor(build, abilities);
  const effects = collectEffects(build);
  const derived: DerivedInput = { build, effects, context };
  const proficiencies = proficienciesFor(build, effects);

  return {
    ...identityOf(build),
    ...derivedValuesOf(derived),
    ...skillsOf(context, proficiencies),
    level: build.level,
    proficiencyBonus: context.proficiencyBonus,
    abilities,
    proficiencies,
    spellcasting: resolveSpellcasting({ ...context, build }),
    features: resolveFeatures(effects),
    resources: resolveResources(effects, context),
  };
}

function derivedValuesOf(
  derived: DerivedInput,
): Pick<
  ComputedCharacter,
  'maxHitPoints' | 'armorClass' | 'initiative' | 'speed' | 'unarmedDamage'
> {
  const { build, effects, context } = derived;

  return {
    maxHitPoints: resolveMaxHitPoints(derived),
    armorClass: resolveArmorClass({ equipment: build.equipment, effects, context }),
    initiative: resolveInitiative(derived),
    speed: resolveSpeed(derived),
    unarmedDamage: resolveUnarmedDamage(effects),
  };
}

function contextFor(
  build: CharacterBuild,
  abilities: Record<Ability, ResolvedAbility>,
): FormulaContext {
  return {
    level: build.level,
    proficiencyBonus: proficiencyBonusAt(build.level),
    abilityModifiers: modifiersOf(abilities),
  };
}

function proficienciesFor(
  build: CharacterBuild,
  effects: ReturnType<typeof collectEffects>,
): ResolvedProficiencies {
  return resolveProficiencies(effects, build.choices, CLASSES[build.classKey].savingThrows);
}

function skillsOf(
  context: FormulaContext,
  proficiencies: ResolvedProficiencies,
): Pick<ComputedCharacter, 'skills' | 'savingThrows' | 'passivePerception'> {
  const input = { ...context, proficiencies };
  const skills = resolveSkills(input);

  return {
    skills,
    savingThrows: resolveSavingThrows(input),
    passivePerception: passivePerceptionOf(skills),
  };
}

function identityOf(
  build: CharacterBuild,
): Pick<
  ComputedCharacter,
  'speciesName' | 'lineageName' | 'className' | 'backgroundName' | 'size' | 'darkvision'
> {
  const species = SPECIES[build.speciesKey];
  const lineage = species.lineage?.options.find((option) => option.key === build.lineageKey);

  return {
    speciesName: species.name,
    lineageName: lineage?.name ?? null,
    className: CLASSES[build.classKey].name,
    backgroundName: BACKGROUNDS[build.backgroundKey].name,
    size: species.size,
    darkvision: species.darkvision,
  };
}
