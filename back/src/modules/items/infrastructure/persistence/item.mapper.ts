import { Item } from '../../domain/item';
import type { ItemSnapshot } from '../../domain/item';

/** Agrégat ↔ document Mongo. */
export type ItemDocument = ItemSnapshot;

export function toDomain(document: ItemDocument): Item {
  return Item.restore(document);
}

export function toPersistence(item: Item): ItemDocument {
  return item.snapshot();
}
