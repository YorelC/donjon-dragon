import { InvalidDomainError } from '@kernel/domain/domain.error';

import { ABILITIES } from './reference/abilities';

/**
 * Le tirage des caractéristiques : quatre d6, on garde les trois meilleurs, six
 * fois. Les dés bruts sont conservés, pas seulement les totaux — c'est ce qui
 * permet d'afficher le détail du lancer, et de prouver après coup que le total
 * n'a pas été inventé.
 */
export const DICE_PER_ROLL = 4;
export const DIE_SIDES = 6;
export const DICE_KEPT = 3;

export const ROLL_COUNT = ABILITIES.length;

export interface AbilityRollSnapshot {
  /** Six lancers de quatre dés, dans l'ordre où ils sont sortis. */
  dice: number[][];
}

export class InvalidAbilityRollError extends InvalidDomainError {
  constructor() {
    super('Ability roll must be six rolls of four d6');
  }
}

export class AbilityRoll {
  declare private readonly brand: 'AbilityRoll';

  private constructor(private readonly dice: readonly (readonly number[])[]) {}

  static create(dice: readonly (readonly number[])[]): AbilityRoll {
    if (dice.length !== ROLL_COUNT || !dice.every(isFourDice)) {
      throw new InvalidAbilityRollError();
    }
    return new AbilityRoll(dice.map((roll) => [...roll]));
  }

  static restore(snapshot: AbilityRollSnapshot): AbilityRoll {
    return new AbilityRoll(snapshot.dice.map((roll) => [...roll]));
  }

  /** Les six totaux, dans l'ordre du tirage : somme des trois meilleurs dés. */
  get totals(): number[] {
    return this.dice.map(keepBestThree);
  }

  snapshot(): AbilityRollSnapshot {
    return { dice: this.dice.map((roll) => [...roll]) };
  }
}

function isFourDice(roll: readonly number[]): boolean {
  return roll.length === DICE_PER_ROLL && roll.every(isDieFace);
}

function isDieFace(die: number): boolean {
  return Number.isInteger(die) && die >= 1 && die <= DIE_SIDES;
}

function keepBestThree(roll: readonly number[]): number {
  return [...roll]
    .sort(descending)
    .slice(0, DICE_KEPT)
    .reduce((total, die) => total + die, 0);
}

function descending(left: number, right: number): number {
  return right - left;
}
