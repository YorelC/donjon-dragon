import type { Dice } from '@kernel/application/dice.port';

/**
 * Dé de test : il rend la séquence qu'on lui a donnée, dans l'ordre.
 *
 * C'est ce qui rend un tirage 4d6 testable aux bords — six 6 d'affilée, six 1,
 * un dé le plus bas exactement à la bonne place — au lieu de moquer `crypto` ou
 * de tolérer une plage de valeurs.
 */
export class FixedDice implements Dice {
  private index = 0;

  constructor(private readonly sequence: readonly number[]) {}

  roll(_sides: number): number {
    const value = this.sequence[this.index % this.sequence.length];
    if (value === undefined) throw new Error('FixedDice: séquence vide');
    this.index += 1;
    return value;
  }

  /** Nombre de dés déjà consommés, pour vérifier qu'on a lancé ce qu'il fallait. */
  get rollCount(): number {
    return this.index;
  }
}

/** Six lancers de 4d6 qui donnent le tableau standard 15/14/13/12/10/8. */
export const STANDARD_ARRAY_ROLLS: readonly number[] = [
  6, 5, 4, 1, // 15
  6, 4, 4, 2, // 14
  5, 4, 4, 3, // 13
  4, 4, 4, 1, // 12
  4, 3, 3, 2, // 10
  3, 3, 2, 1, // 8
];
