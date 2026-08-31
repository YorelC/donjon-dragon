import type { AbilityAssignment } from '../ability-assignment';
import {
  ABILITIES,
  abilityModifier,
  type Ability,
} from '../reference/abilities';

export interface ResolvedAbility {
  score: number;
  modifier: number;
}

export type ResolvedAbilities = Record<Ability, ResolvedAbility>;

/**
 * Le tirage posé sur chaque caractéristique, plus les bonus de l'historique.
 * L'agrégat a déjà refusé une composition qui dépasserait 20.
 *
 * Aucun effet passif n'entre ici : au niveau 1, en 2024, aucun trait d'espèce ni
 * don d'Origines n'augmente une caractéristique. Le jour où il y en aura un, il
 * s'ajoutera avant le plafond, pas après.
 */
export function resolveAbilities(assignment: AbilityAssignment): ResolvedAbilities {
  const { base, backgroundBonuses } = assignment.snapshot();

  return Object.fromEntries(
    ABILITIES.map((ability) => {
      const score = base[ability] + (backgroundBonuses[ability] ?? 0);
      return [ability, { score, modifier: abilityModifier(score) }];
    }),
  ) as ResolvedAbilities;
}

export function modifiersOf(abilities: ResolvedAbilities): Record<Ability, number> {
  return Object.fromEntries(
    ABILITIES.map((ability) => [ability, abilities[ability].modifier]),
  ) as Record<Ability, number>;
}
