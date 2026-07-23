export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export const DICE_MAX: Record<DiceType, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
  d100: 100,
};

export type DiceRoll = {
  die: DiceType;
  result: number;
};

export type DiceRollResult = {
  die: DiceType;
  count: number;
  modifier: number;
  rolls: number[];
  total: number;
};
