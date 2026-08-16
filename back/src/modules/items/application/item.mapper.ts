import type { Item as ItemDto } from '@donjon-dragon/shared/item-schema';

import type { Item } from '../domain/item';

/**
 * Agrégat → HTTP. Le domaine et le contrat partagé décrivent la même forme sans
 * se connaître : ce mapper est l'endroit où les deux se rencontrent.
 *
 * Il copie plutôt qu'il ne renvoie la référence — `snapshot()` a déjà fait le
 * travail, y compris pour le contenu des paquetages.
 */
export function toItemDto(item: Item): ItemDto {
  return item.snapshot();
}
