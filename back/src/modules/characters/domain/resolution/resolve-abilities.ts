import type { AbilityAssignment } from '../ability-assignment';
import {
  ABILITIES,
  MAX_ABILITY_SCORE_AT_CREATION,
  abilityModifier,
  type Ability,
} from '../reference/abilities';

export interface ResolvedAbility {
  score: number;
  modifier: number;
}

export type ResolvedAbilities = Record<Ability, ResolvedAbility>;

/**
 * Le tirage posé sur chaque caractéristique, plus les bonus de l'historique,
 * plafonné à 20 — c'est le plafond de la création, pas celui du jeu.
 *
 * Aucun effet passif n'entre ici : au niveau 1, en 2024, aucun trait d'espèce ni
 * don d'Origines n'augmente une caractéristique. Le jour où il y en aura un, il
 * s'ajoutera avant le plafond, pas après.
 */
export function resolveAbilities(assignment: AbilityAssignment): ResolvedAbilities {
  const { base, backgroundBonuses } = assignment.snapshot();

  return Object.fromEntries(
    ABILITIES.map((ability) => {
      const score = Math.min(
        base[ability] + (backgroundBonuses[ability] ?? 0),
        MAX_ABILITY_SCORE_AT_CREATION,
      );
      return [ability, { score, modifier: abilityModifier(score) }];
    }),
  ) as ResolvedAbilities;
}

export function modifiersOf(abilities: ResolvedAbilities): Record<Ability, number> {
  return Object.fromEntries(
    ABILITIES.map((ability) => [ability, abilities[ability].modifier]),
  ) as Record<Ability, number>;
}
