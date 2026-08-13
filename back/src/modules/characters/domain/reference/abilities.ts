// Les six caractéristiques de D&D 2024, et les deux formules qui en dérivent tout
// le reste. Données de référence : pures, immuables, sans I/O.

export const ABILITIES = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
] as const;

export type Ability = (typeof ABILITIES)[number];

/**
 * Un score de 10 vaut un modificateur de 0, et chaque tranche de 2 points en
 * ajoute 1 — arrondi vers le bas, y compris sous 10 (un score de 7 vaut -2).
 */
const MODIFIER_PIVOT = 10;
const POINTS_PER_MODIFIER = 2;

export function abilityModifier(score: number): number {
  return Math.floor((score - MODIFIER_PIVOT) / POINTS_PER_MODIFIER);
}

/**
 * Le bonus de maîtrise part de +2 au niveau 1 et gagne 1 tous les quatre
 * niveaux. La table du PHB n'est que la forme déroulée de ce calcul.
 */
const BASE_PROFICIENCY_BONUS = 2;
const LEVELS_PER_PROFICIENCY_STEP = 4;

export function proficiencyBonusAt(level: number): number {
  return BASE_PROFICIENCY_BONUS + Math.floor((level - 1) / LEVELS_PER_PROFICIENCY_STEP);
}

/** Plafond d'un score après application des bonus d'historique, à la création. */
export const MAX_ABILITY_SCORE_AT_CREATION = 20;

export type AbilityRecord = Record<Ability, number>;
