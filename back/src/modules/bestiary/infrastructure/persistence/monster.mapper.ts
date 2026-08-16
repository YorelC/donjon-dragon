import { Monster } from '../../domain/monster';
import type { MonsterSnapshot } from '../../domain/monster';

/** Agrégat ↔ document Mongo. */
export type MonsterDocument = MonsterSnapshot;

export function toDomain(document: MonsterDocument): Monster {
  return Monster.restore(document);
}

export function toPersistence(monster: Monster): MonsterDocument {
  return monster.snapshot();
}
