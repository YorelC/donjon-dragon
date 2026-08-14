// Les trois façons de fixer ses caractéristiques à la création, et ce qui
// distingue chacune. Le PHB 2024 les met sur le même plan : c'est le joueur qui
// choisit, pas la table.

export const ABILITY_METHODS = ['roll', 'standardArray', 'pointBuy'] as const;

export type AbilityMethod = (typeof ABILITY_METHODS)[number];

/** Quatre d6 dont on garde les trois meilleurs, six fois. */
export const ROLL_METHOD: AbilityMethod = 'roll';

/** Les six valeurs imposées du tableau standard. */
export const STANDARD_ARRAY: readonly number[] = [15, 14, 13, 12, 10, 8];

/**
 * Le coût de chaque valeur en achat de points. Une table, pas une formule : le
 * PHB casse la progression à 14 (7 points au lieu de 6), et une formule qui
 * essaierait de la reproduire serait plus longue que la table elle-même.
 */
export const POINT_BUY_COSTS: Readonly<Record<number, number>> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

export const POINT_BUY_BUDGET = 27;

export const POINT_BUY_BOUNDS = { min: 8, max: 15 } as const;

export function pointBuyCostOf(scores: readonly number[]): number {
  return scores.reduce((total, score) => total + (POINT_BUY_COSTS[score] ?? 0), 0);
}

export function isWithinPointBuyRange(score: number): boolean {
  return score >= POINT_BUY_BOUNDS.min && score <= POINT_BUY_BOUNDS.max;
}
