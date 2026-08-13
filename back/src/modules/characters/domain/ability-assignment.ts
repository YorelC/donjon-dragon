import { InvalidDomainError } from '@kernel/domain/domain.error';

import type { AbilityRoll } from './ability-roll';
import { ABILITIES, type Ability, type AbilityRecord } from './reference/abilities';
import { BACKGROUND_ABILITY_BONUS_PLANS } from './reference/backgrounds';

export type AbilityBonuses = Partial<Record<Ability, number>>;

export interface AbilityAssignmentSnapshot {
  /** La valeur du tirage posée sur chaque caractéristique, avant bonus. */
  base: AbilityRecord;
  /** Les +2/+1 ou +1/+1/+1 de l'historique. */
  backgroundBonuses: AbilityBonuses;
}

export class AbilityAssignmentMismatchError extends InvalidDomainError {
  constructor() {
    super('Assigned scores are not a permutation of the roll');
  }
}

export class InvalidBackgroundBonusesError extends InvalidDomainError {
  constructor() {
    super('Background ability bonuses must be +2/+1 or +1/+1/+1 on its three abilities');
  }
}

export interface AbilityAssignmentInput {
  roll: AbilityRoll;
  base: AbilityRecord;
  backgroundBonuses: AbilityBonuses;
}

/**
 * La répartition du tirage sur les six caractéristiques, plus les bonus de
 * l'historique.
 *
 * L'invariant qui compte est celui de la permutation : les six valeurs posées
 * doivent être exactement les six totaux tirés, ni plus ni moins. Sans lui, le
 * tirage côté serveur ne servirait à rien — un client enverrait six 18.
 */
export class AbilityAssignment {
  declare private readonly brand: 'AbilityAssignment';

  private constructor(
    private readonly base: AbilityRecord,
    private readonly bonuses: AbilityBonuses,
  ) {}

  static create(input: AbilityAssignmentInput): AbilityAssignment {
    if (!isPermutationOf(input.roll.totals, Object.values(input.base))) {
      throw new AbilityAssignmentMismatchError();
    }
    return new AbilityAssignment({ ...input.base }, { ...input.backgroundBonuses });
  }

  static restore(snapshot: AbilityAssignmentSnapshot): AbilityAssignment {
    return new AbilityAssignment(
      { ...snapshot.base },
      { ...snapshot.backgroundBonuses },
    );
  }

  /**
   * Les bonus se valident contre l'historique, que ce VO ne connaît pas : c'est
   * l'agrégat qui appelle, parce que lui sait quel historique a été choisi.
   */
  assertBonusesFit(allowed: readonly Ability[]): void {
    const chosen = Object.keys(this.bonuses) as Ability[];
    if (!chosen.every((ability) => allowed.includes(ability))) {
      throw new InvalidBackgroundBonusesError();
    }
    if (!matchesAKnownPlan(Object.values(this.bonuses))) {
      throw new InvalidBackgroundBonusesError();
    }
  }

  snapshot(): AbilityAssignmentSnapshot {
    return { base: { ...this.base }, backgroundBonuses: { ...this.bonuses } };
  }
}

function isPermutationOf(expected: readonly number[], actual: readonly number[]): boolean {
  if (expected.length !== actual.length) return false;
  const sortedExpected = [...expected].sort(ascending);
  const sortedActual = [...actual].sort(ascending);
  return sortedExpected.every((value, index) => value === sortedActual[index]);
}

function matchesAKnownPlan(bonuses: readonly number[]): boolean {
  return Object.values(BACKGROUND_ABILITY_BONUS_PLANS).some((plan) =>
    isPermutationOf(plan, bonuses),
  );
}

function ascending(left: number, right: number): number {
  return left - right;
}

/** Toutes les caractéristiques sont présentes, même celles laissées à leur tirage. */
export function emptyAbilityRecord(): AbilityRecord {
  return Object.fromEntries(ABILITIES.map((ability) => [ability, 0])) as AbilityRecord;
}
