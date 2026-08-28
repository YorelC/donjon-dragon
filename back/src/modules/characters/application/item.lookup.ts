import type { CharacterEquipment } from '@donjon-dragon/shared/character-schema';

import type { ItemCatalogPort } from './ports/item-catalog.port';
import { NotAnArmorError, UnknownItemError } from '../domain/character.errors';
import { creationItemName } from '../domain/reference/creation-options';

/**
 * Les vérifications que le domaine ne peut pas faire : le catalogue d'objets vit
 * dans une collection, et le domaine ne fait pas d'I/O. Le use-case résout les
 * clés ici, puis l'agrégat reçoit des données déjà sûres.
 *
 * Le port arrive en paramètre, comme dans `character.lookup.ts` : cette
 * fonction n'a pas de dépendance propre, donc rien à injecter.
 */
export async function assertEquipmentIsKnown(
  catalog: ItemCatalogPort,
  equipment: CharacterEquipment,
  campaignId: string,
): Promise<void> {
  const keys = wantedKeys(equipment);
  if (keys.length === 0) return;

  const found = await catalog.findByKeys(keys, campaignId);
  if (found.length !== keys.length) throw new UnknownItemError();

  assertArmorIsWearable(equipment.armorKey, found);
}

function wantedKeys(equipment: CharacterEquipment): string[] {
  const carried = equipment.items.map((item) => item.itemKey);
  const worn = equipment.armorKey === null ? [] : [equipment.armorKey];

  return [...new Set([...carried, ...worn])].filter(isCatalogItem);
}

function isCatalogItem(key: string): boolean {
  return creationItemName(key) === null;
}

/**
 * Porter une corde ne protège de rien. Sans ce refus, un client pourrait poser
 * n'importe quelle clé dans `armorKey` : le moteur n'y verrait qu'une armure
 * sans statistiques et calculerait la CA d'un personnage torse nu, en silence.
 */
function assertArmorIsWearable(
  armorKey: string | null,
  found: { key: string; armor: unknown }[],
): void {
  if (armorKey === null) return;

  const armor = found.find((item) => item.key === armorKey);
  if (!armor?.armor) throw new NotAnArmorError();
}
