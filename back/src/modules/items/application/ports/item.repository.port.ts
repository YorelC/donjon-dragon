import type { Item } from '../../domain/item';
import type { ItemKey } from '../../domain/item-key';

export const ITEM_REPOSITORY = Symbol('ITEM_REPOSITORY');

/**
 * Le port parle l'agrégat, pas le document.
 *
 * `findReferenceItems` ne rend que le manuel. `findManyByKeys` y ajoute ce qu'une
 * campagne a inventé quand on lui en donne une, et l'objet de campagne l'emporte
 * sur celui du manuel à clé égale.
 */
export interface ItemRepositoryPort {
  save(item: Item): Promise<void>;
  findReferenceItems(): Promise<Item[]>;
  findManyByKeys(keys: ItemKey[], campaignId: string | null): Promise<Item[]>;
}
