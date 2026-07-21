// ============================================================
// back/test/unit/character/domain/dice.test.ts
// Tests — Système de dés (fonctions pures, sans I/O)
// ============================================================
// RED: ces tests échouent car dice.ts n'existe pas encore
// ============================================================

import { describe, it, expect } from 'vitest';

// Les imports échouent — c'est le RED voulu
// L'ouvrier implémente dice.ts jusqu'à ce que ces tests passent
import {
  roll,
  rollDice,
  rollWithAdvantage,
  rollWithDisadvantage,
  checkCritical,
  type DiceType,
  type DiceRollResult,
} from '../../../../src/combat/domain/dice.js';

describe('dice — roll()', () => {
  it('retourne un DiceRoll avec type et result', () => {
    const result = roll('d20');
    expect(result).toHaveProperty('type', 'd20');
    expect(result).toHaveProperty('result');
    expect(typeof result.result).toBe('number');
  });

  it.each(['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] as DiceType[])(
    'roll(%s) → résultat dans les bornes [1, max]',
    (die) => {
      const max = parseInt(die.slice(1), 10);
      for (let i = 0; i < 100; i++) {
        const { result } = roll(die);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(max);
      }
    },
  );
});

describe('dice — rollDice()', () => {
  it('lance N dés et retourne le total + détail', () => {
    const result = rollDice('d6', 3, 2);
    expect(result.rolls).toHaveLength(3);
    expect(result.modifier).toBe(2);
    result.rolls.forEach((r) => {
      expect(r.type).toBe('d6');
      expect(r.result).toBeGreaterThanOrEqual(1);
      expect(r.result).toBeLessThanOrEqual(6);
    });
    expect(result.total).toBe(result.rawTotal + result.modifier);
  });

  it('rollDice(d20, 1) sans mod → rawTotal === total', () => {
    const result = rollDice('d20', 1);
    expect(result.total).toBe(result.rawTotal);
    expect(result.modifier).toBe(0);
  });

  it('0 dés → rolls vide, total = mod', () => {
    const result = rollDice('d6', 0, 5);
    expect(result.rolls).toHaveLength(0);
    expect(result.total).toBe(5);
  });
});

describe('dice — rollWithAdvantage()', () => {
  it('retourne 2 rolls et prend le meilleur', () => {
    // Fournit une fonction qui retourne des valeurs prévisibles
    let callCount = 0;
    const mockRoll = () => {
      callCount++;
      return callCount === 1 ? 10 : 18;
    };

    const result = rollWithAdvantage(mockRoll);
    expect(result.rolls).toEqual([10, 18]);
    expect(result.result).toBe(18);
  });

  it('quand les deux rolls sont égaux, la valeur est correcte', () => {
    const mockRoll = () => 15;
    const result = rollWithAdvantage(mockRoll);
    expect(result.result).toBe(15);
  });
});

describe('dice — rollWithDisadvantage()', () => {
  it('retourne 2 rolls et prend le pire', () => {
    let callCount = 0;
    const mockRoll = () => {
      callCount++;
      return callCount === 1 ? 10 : 18;
    };

    const result = rollWithDisadvantage(mockRoll);
    expect(result.rolls).toEqual([10, 18]);
    expect(result.result).toBe(10);
  });
});

describe('dice — checkCritical()', () => {
  it('20 → success', () => {
    expect(checkCritical(20)).toBe('success');
  });

  it('1 → failure', () => {
    expect(checkCritical(1)).toBe('failure');
  });

  it.each([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19])(
    '%i → none',
    (val) => {
      expect(checkCritical(val)).toBe('none');
    },
  );
});