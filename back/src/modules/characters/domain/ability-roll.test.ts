import { describe, expect, it } from 'vitest';

import { FixedDice, STANDARD_ARRAY_ROLLS } from '@kernel/testing/fixed-dice';

import { AbilityRoll, DICE_PER_ROLL, InvalidAbilityRollError, ROLL_COUNT } from './ability-roll';

function rollWith(dice: FixedDice): AbilityRoll {
  return AbilityRoll.create(
    Array.from({ length: ROLL_COUNT }, () =>
      Array.from({ length: DICE_PER_ROLL }, () => dice.roll(6)),
    ),
  );
}

describe('AbilityRoll', () => {
  it('garde les trois meilleurs dés de chaque lancer', () => {
    const roll = rollWith(new FixedDice(STANDARD_ARRAY_ROLLS));

    expect(roll.totals).toEqual([15, 14, 13, 12, 10, 8]);
  });

  it('borne les totaux entre 3 et 18', () => {
    expect(rollWith(new FixedDice([1])).totals).toEqual([3, 3, 3, 3, 3, 3]);
    expect(rollWith(new FixedDice([6])).totals).toEqual([18, 18, 18, 18, 18, 18]);
  });

  it('conserve les dés bruts, pour que le total reste vérifiable', () => {
    const roll = AbilityRoll.create([
      [6, 5, 4, 1],
      [1, 1, 1, 1],
      [2, 2, 2, 2],
      [3, 3, 3, 3],
      [4, 4, 4, 4],
      [5, 5, 5, 5],
    ]);

    expect(roll.snapshot().dice[0]).toEqual([6, 5, 4, 1]);
  });

  it('refuse un tirage qui n’a pas six lancers de quatre dés', () => {
    expect(() => AbilityRoll.create([[6, 5, 4, 1]])).toThrow(InvalidAbilityRollError);
  });

  it('refuse une face qui n’existe pas sur un d6', () => {
    const withImpossibleDie = [
      [6, 6, 6, 7],
      [1, 1, 1, 1],
      [2, 2, 2, 2],
      [3, 3, 3, 3],
      [4, 4, 4, 4],
      [5, 5, 5, 5],
    ];

    expect(() => AbilityRoll.create(withImpossibleDie)).toThrow(InvalidAbilityRollError);
  });
});
