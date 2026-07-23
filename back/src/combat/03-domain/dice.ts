import { DICE_MAX, type DiceType, type DiceRoll, type DiceRollResult } from './dice.entity.js';

export function roll(die: DiceType): DiceRoll {
  const max = DICE_MAX[die];
  const result = Math.floor(Math.random() * max) + 1;
  return { die, result };
}

export function rollDice(dice: DiceType, count: number, modifier = 0): DiceRollResult {
  const rolls = Array.from({ length: count }, () => roll(dice).result);
  const total = rolls.reduce((sum, value) => sum + value, 0) + modifier;

  return { die: dice, count, modifier, rolls, total };
}

export function rollWithAdvantage(
  rollFn: () => number,
): { rolls: [number, number]; result: number } {
  const rolls: [number, number] = [rollFn(), rollFn()];
  return { rolls, result: Math.max(...rolls) };
}

export function rollWithDisadvantage(
  rollFn: () => number,
): { rolls: [number, number]; result: number } {
  const rolls: [number, number] = [rollFn(), rollFn()];
  return { rolls, result: Math.min(...rolls) };
}

export function checkCritical(d20Result: number): 'none' | 'success' | 'failure' {
  if (d20Result === 20) return 'success';
  if (d20Result === 1) return 'failure';
  return 'none';
}
