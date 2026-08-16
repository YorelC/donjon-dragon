import type { Monster as MonsterDto } from '@donjon-dragon/shared/monster-schema';

import type { Monster } from '../domain/monster';

/**
 * Agrégat → HTTP. Le domaine et le contrat partagé décrivent la même forme sans
 * se connaître : ce mapper est l'endroit où les deux se rencontrent.
 *
 * `snapshot()` a déjà recopié les tableaux d'actions et le bloc de
 * caractéristiques — rien ne fuit par référence.
 */
export function toMonsterDto(monster: Monster): MonsterDto {
  return monster.snapshot();
}
