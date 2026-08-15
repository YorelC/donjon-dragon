import type { AbilityRoll } from "@donjon-dragon/shared";
import { ABILITY_ROLL_COUNT, DICE_PER_ABILITY_ROLL } from "@donjon-dragon/shared";

const DIE_SIDES = 6;
const DICE_KEPT = 3;

/**
 * Le tirage se fait dans le navigateur : quatre d6 par caractéristique, on
 * garde les trois meilleurs, six fois. Rien n'est vérifié côté serveur — voir
 * le commentaire de classe de `Character` au back.
 */
export function rollAbilities(): AbilityRoll {
  const dice = Array.from({ length: ABILITY_ROLL_COUNT }, () =>
    Array.from({ length: DICE_PER_ABILITY_ROLL }, rollDie),
  );

  return { dice, totals: dice.map(keepBestThree) };
}

function rollDie(): number {
  return Math.floor(Math.random() * DIE_SIDES) + 1;
}

function keepBestThree(roll: number[]): number {
  return [...roll]
    .sort((left, right) => right - left)
    .slice(0, DICE_KEPT)
    .reduce((total, die) => total + die, 0);
}
