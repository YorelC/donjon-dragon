import { randomInt } from 'crypto';
import { Injectable } from '@nestjs/common';

import type { Dice } from '@kernel/application/dice.port';

/**
 * Le dé réel. `crypto.randomInt` plutôt que `Math.random` : le tirage décide des
 * caractéristiques d'un personnage, donc un joueur a intérêt à le prédire, et
 * `Math.random` n'offre aucune garantie contre ça.
 *
 * `randomInt(min, max)` exclut la borne haute — d'où le `+ 1`.
 */
@Injectable()
export class CryptoDice implements Dice {
  roll(sides: number): number {
    return randomInt(1, sides + 1);
  }
}
