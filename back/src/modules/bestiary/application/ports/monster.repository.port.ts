import type { Monster } from '../../domain/monster';
import type { MonsterKey } from '../../domain/monster-key';

export const MONSTER_REPOSITORY = Symbol('MONSTER_REPOSITORY');

/**
 * Le port parle l'agrégat, pas le document.
 *
 * `findReferenceMonsters` ne rend que le manuel. `findVisibleIn` y ajoute ce
 * qu'une campagne a inventé, et le profil de campagne l'emporte sur celui du
 * manuel à clé égale.
 */
export interface MonsterRepositoryPort {
  save(monster: Monster): Promise<void>;
  findReferenceMonsters(): Promise<Monster[]>;
  findVisibleIn(campaignId: string | null): Promise<Monster[]>;
  findByKey(key: MonsterKey, campaignId: string | null): Promise<Monster | null>;
}
