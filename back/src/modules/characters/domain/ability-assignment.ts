import { InvalidDomainError } from '@kernel/domain/domain.error';

import {
  POINT_BUY_BUDGET,
  STANDARD_ARRAY,
  isWithinPointBuyRange,
  pointBuyCostOf,
  type AbilityMethod,
} from './ability-generation';
import type { AbilityRoll } from './ability-roll';
import { AbilitiesNotRolledError } from './character.errors';
import { ABILITIES, type Ability, type AbilityRecord } from './reference/abilities';
import { BACKGROUND_ABILITY_BONUS_PLANS } from './reference/backgrounds';

export type AbilityBonuses = Partial<Record<Ability, number>>;

export interface AbilityAssignmentSnapshot {
  /** La valeur posée sur chaque caractéristique, avant bonus. */
  base: AbilityRecord;
  /** Les +2/+1 ou +1/+1/+1 de l'historique. */
  backgroundBonuses: AbilityBonuses;
  /** D'où viennent ces scores : la fiche doit pouvoir le dire. */
  method: AbilityMethod;
}

export class AbilityAssignmentMismatchError extends InvalidDomainError {
  constructor() {
    super('Assigned scores are not a permutation of the roll');
  }
}

export class NotAStandardArrayError extends InvalidDomainError {
  constructor() {
    super('Assigned scores are not the standard array');
  }
}

export class ScoreOutsidePointBuyRangeError extends InvalidDomainError {
  constructor() {
    super('Point buy scores must be between 8 and 15');
  }
}

export class PointBuyBudgetExceededError extends InvalidDomainError {
  constructor() {
    super(`Point buy costs more than ${POINT_BUY_BUDGET} points`);
  }
}

export class InvalidBackgroundBonusesError extends InvalidDomainError {
  constructor() {
    super('Background ability bonuses must be +2/+1 or +1/+1/+1 on its three abilities');
  }
}

export interface AbilityAssignmentInput {
  method: AbilityMethod;
  /** Nécessaire pour la méthode `roll`, ignoré par les deux autres. */
  roll: AbilityRoll | null;
  base: AbilityRecord;
  backgroundBonuses: AbilityBonuses;
}

type MethodValidator = (base: readonly number[], roll: AbilityRoll | null) => void;

/**
 * Chaque méthode porte sa propre vérification. C'est ce qui fait qu'aucune ne
 * peut servir de porte dérobée : un joueur qui annonce « tableau standard » doit
 * fournir exactement les six valeurs du tableau, et un joueur qui annonce
 * « achat de points » ne peut pas dépenser 28 points.
 */
const VALIDATORS: Record<AbilityMethod, MethodValidator> = {
  roll: (base, roll) => {
    if (!roll) throw new AbilitiesNotRolledError();
    if (!isPermutationOf(roll.totals, base)) throw new AbilityAssignmentMismatchError();
  },
  standardArray: (base) => {
    if (!isPermutationOf(STANDARD_ARRAY, base)) throw new NotAStandardArrayError();
  },
  pointBuy: (base) => {
    if (!base.every(isWithinPointBuyRange)) throw new ScoreOutsidePointBuyRangeError();
    if (pointBuyCostOf(base) > POINT_BUY_BUDGET) throw new PointBuyBudgetExceededError();
  },
};

/**
 * La répartition des six caractéristiques, plus les bonus de l'historique.
 *
 * L'invariant qui compte dépend de la méthode annoncée, mais il existe dans les
 * trois cas — sans lui, rien n'empêcherait un client d'envoyer six 18.
 */
export class AbilityAssignment {
  declare private readonly brand: 'AbilityAssignment';

  private constructor(
    private readonly base: AbilityRecord,
    private readonly bonuses: AbilityBonuses,
    readonly method: AbilityMethod,
  ) {}

  static create(input: AbilityAssignmentInput): AbilityAssignment {
    VALIDATORS[input.method](Object.values(input.base), input.roll);

    return new AbilityAssignment(
      { ...input.base },
      { ...input.backgroundBonuses },
      input.method,
    );
  }

  static restore(snapshot: AbilityAssignmentSnapshot): AbilityAssignment {
    return new AbilityAssignment(
      { ...snapshot.base },
      { ...snapshot.backgroundBonuses },
      snapshot.method,
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
    return {
      base: { ...this.base },
      backgroundBonuses: { ...this.bonuses },
      method: this.method,
    };
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
