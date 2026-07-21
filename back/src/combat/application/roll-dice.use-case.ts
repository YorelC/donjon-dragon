import { rollDice } from '../domain/dice.js';
import type { DiceType } from '../domain/dice.entity.js';

export type RollDicePayload = {
  diceType: DiceType;
  count: number;
  modifier: number;
};

export type RollDiceResult = {
  die: DiceType;
  count: number;
  modifier: number;
  rolls: number[];
  rawTotal: number;
  total: number;
};

export class RollDiceUseCase {
  execute(payload: RollDicePayload): RollDiceResult {
    const { die, count, modifier, rolls, total } = rollDice(
      payload.diceType,
      payload.count,
      payload.modifier,
    );
    return { die, count, modifier, rolls, rawTotal: total - modifier, total };
  }
}
