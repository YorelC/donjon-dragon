// ============================================================
// back/test/unit/character/domain/dice.test.ts
// Tests — Système de dés D&D 5e
// ============================================================
// RED: ces tests échouent car dice.entity.ts / dice.ts n'existent pas
// ============================================================

import { describe, it, expect, vi, afterEach } from 'vitest';

import {
  roll,
  rollDice,
  rollWithAdvantage,
  rollWithDisadvantage,
  checkCritical,
} from '../../../../src/combat/domain/dice.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('dice — roll()', () => {
  it('random=0 → 1 (plus petit résultat possible)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = roll('d20');
    expect(result.die).toBe('d20');
    expect(result.result).toBe(1);
  });

  it('random proche de 1 → valeur max du dé', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999999);
    const result = roll('d20');
    expect(result.result).toBe(20);
  });

  it('random=0.5 sur d20 → 11', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = roll('d20');
    expect(result.result).toBe(11);
  });

  it('random=0.5 sur d6 → 4', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = roll('d6');
    expect(result.result).toBe(4);
  });

  it('d100 respecte son max', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999999);
    const result = roll('d100');
    expect(result.result).toBe(100);
  });
});

describe('dice — rollDice()', () => {
  it('additionne plusieurs dés sans modificateur', () => {
    const sequence = [0, 0.5, 0.999999]; // d6 → 1, 4, 6
    let i = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => sequence[i++]);

    const result = rollDice('d6', 3);
    expect(result.rolls).toEqual([1, 4, 6]);
    expect(result.total).toBe(11);
    expect(result.die).toBe('d6');
    expect(result.count).toBe(3);
    expect(result.modifier).toBe(0);
  });

  it('applique le modificateur au total', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // d8 → 5
    const result = rollDice('d8', 1, 3);
    expect(result.rolls).toEqual([5]);
    expect(result.total).toBe(8);
    expect(result.modifier).toBe(3);
  });

  it('modificateur négatif', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // d8 → 5
    const result = rollDice('d8', 1, -2);
    expect(result.total).toBe(3);
  });
});

describe('dice — rollWithAdvantage()', () => {
  it('prend le maximum des deux lancers', () => {
    const sequence = [8, 15];
    let i = 0;
    const rollFn = () => sequence[i++];

    const outcome = rollWithAdvantage(rollFn);
    expect(outcome.rolls).toEqual([8, 15]);
    expect(outcome.result).toBe(15);
  });

  it('prend le maximum même si le premier lancer est le plus élevé', () => {
    const sequence = [18, 3];
    let i = 0;
    const rollFn = () => sequence[i++];

    const outcome = rollWithAdvantage(rollFn);
    expect(outcome.rolls).toEqual([18, 3]);
    expect(outcome.result).toBe(18);
  });
});

describe('dice — rollWithDisadvantage()', () => {
  it('prend le minimum des deux lancers', () => {
    const sequence = [8, 15];
    let i = 0;
    const rollFn = () => sequence[i++];

    const outcome = rollWithDisadvantage(rollFn);
    expect(outcome.rolls).toEqual([8, 15]);
    expect(outcome.result).toBe(8);
  });

  it('prend le minimum même si le second lancer est le plus bas', () => {
    const sequence = [18, 3];
    let i = 0;
    const rollFn = () => sequence[i++];

    const outcome = rollWithDisadvantage(rollFn);
    expect(outcome.rolls).toEqual([18, 3]);
    expect(outcome.result).toBe(3);
  });
});

describe('dice — checkCritical()', () => {
  it('20 → success', () => expect(checkCritical(20)).toBe('success'));
  it('1 → failure', () => expect(checkCritical(1)).toBe('failure'));
  it('10 → none', () => expect(checkCritical(10)).toBe('none'));
  it('2 → none', () => expect(checkCritical(2)).toBe('none'));
  it('19 → none', () => expect(checkCritical(19)).toBe('none'));
});
