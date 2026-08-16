/**
 * Les unités du manuel anglais, traduites vers celles du projet.
 *
 * Le projet suit la convention du manuel français : une case vaut 1,50 m et une
 * livre vaut 500 g. C'est faux physiquement — un pied vaut 0,3048 m et une livre
 * 453,6 g — et juste ludiquement : les tables françaises sont arrondies ainsi, et
 * un joueur qui compare les deux manuels doit y lire les mêmes nombres.
 */

export type CoinUnit = 'cp' | 'sp' | 'gp';

export type SrdCost = { quantity: number; unit: string };

const COPPER_PER_COIN: Record<CoinUnit, number> = {
  cp: 1,
  sp: 10,
  gp: 100,
};

const KILOGRAMS_PER_POUND = 0.5;
const METERS_PER_FOOT = 0.3;

/** Trois décimales, parce qu'un quart de livre fait 0,125 kg et que 0,13 serait une divergence inventée. */
const ROUNDED_DECIMALS = 3;

export function toCopper(cost: SrdCost): number {
  const copperPerCoin = COPPER_PER_COIN[cost.unit as CoinUnit];
  if (copperPerCoin === undefined) {
    throw new Error(`Unité monétaire inconnue dans le SRD : ${cost.unit}`);
  }
  return cost.quantity * copperPerCoin;
}

/** Le manuel note 0 livre ce qui est négligeable ; le projet le note « inconnu ». */
export function toKilograms(pounds: number | undefined): number | null {
  if (!pounds) return null;
  return round(pounds * KILOGRAMS_PER_POUND);
}

export function toMeters(feet: number): number {
  return round(feet * METERS_PER_FOOT);
}

function round(value: number): number {
  const factor = 10 ** ROUNDED_DECIMALS;
  return Math.round(value * factor) / factor;
}
