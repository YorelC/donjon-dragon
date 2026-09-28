import type {
  ResolvedEquipment,
  ResolvedItem,
} from '@donjon-dragon/shared/character-sheet-schema';

import type { CatalogedItem, ItemCatalogPort } from './ports/item-catalog.port';
import { SHIELD_ITEM_KEY, type CharacterEquipment } from '../domain/character-equipment';
import { creationItemName, isCreationTool } from '../domain/reference/creation-options';
import type { WornArmor, WornEquipment } from '../domain/resolution/worn-equipment';

export interface EquipmentView {
  /** Ce que la fiche affiche. */
  resolved: ResolvedEquipment;
  /** Ce que le moteur consomme pour la classe d'armure. */
  worn: WornEquipment;
}

/**
 * L'équipement du personnage, résolu contre le catalogue d'objets.
 *
 * Une seule lecture sert les deux besoins : nommer l'inventaire pour la fiche,
 * et donner au moteur les statistiques de ce qui est porté. Les séparer ferait
 * deux allers-retours pour les mêmes clés.
 */
export async function resolveEquipment(
  catalog: ItemCatalogPort,
  equipment: CharacterEquipment,
  campaignId: string,
): Promise<EquipmentView> {
  const items = await catalog.findByKeys(keysOf(equipment), campaignId);
  const byKey = new Map([...items, ...virtualItemsOf(equipment)].map((item) => [item.key, item]));

  return {
    resolved: viewOf(equipment, byKey),
    worn: wornOf(equipment, byKey),
  };
}

/**
 * L'armure portée et le bouclier viennent en plus de l'inventaire : le
 * personnage porte forcément ce qu'il possède, mais un document ancien peut
 * porter une armure sans l'avoir en inventaire.
 */
function keysOf(equipment: CharacterEquipment): string[] {
  const carried = equipment.items.map((item) => item.itemKey);
  const worn = [equipment.armorKey, equipment.shield ? SHIELD_ITEM_KEY : null];

  return [...new Set([...carried, ...worn.filter((key): key is string => key !== null)])]
    .filter((key) => creationItemName(key) === null);
}

function virtualItemsOf(equipment: CharacterEquipment): CatalogedItem[] {
  return equipment.items.flatMap((item) => {
    const name = creationItemName(item.itemKey);
    const type = isCreationTool(item.itemKey) ? 'tool' : 'gear';
    return name ? [{ key: item.itemKey, name, type, armor: null }] : [];
  });
}

type Catalog = Map<string, CatalogedItem>;

function viewOf(equipment: CharacterEquipment, catalog: Catalog): ResolvedEquipment {
  const armor = equipment.armorKey ? catalog.get(equipment.armorKey) : undefined;

  return {
    items: equipment.items.map((item) => itemViewOf(item, equipment, catalog)),
    gold: equipment.gold,
    armorName: armor?.name ?? null,
    shield: equipment.shield,
    stealthDisadvantage: armor?.armor?.stealthDisadvantage ?? false,
  };
}

/** Une clé inconnue du catalogue reste listée, rangée dans le matériel. */
function itemViewOf(
  item: CharacterEquipment['items'][number],
  equipment: CharacterEquipment,
  catalog: Catalog,
): ResolvedItem {
  const cataloged = catalog.get(item.itemKey);

  return {
    itemKey: item.itemKey,
    name: cataloged?.name ?? item.itemKey,
    quantity: item.quantity,
    type: cataloged?.type ?? 'gear',
    worn: isWorn(item.itemKey, equipment),
  };
}

function isWorn(itemKey: string, equipment: CharacterEquipment): boolean {
  return itemKey === equipment.armorKey || (equipment.shield && itemKey === SHIELD_ITEM_KEY);
}

function wornOf(equipment: CharacterEquipment, catalog: Catalog): WornEquipment {
  return {
    armor: equipment.armorKey ? toWornArmor(catalog.get(equipment.armorKey)) : null,
    shield: equipment.shield ? toWornArmor(catalog.get(SHIELD_ITEM_KEY)) : null,
  };
}

/**
 * Un objet sans statistiques d'armure ne protège de rien : porter une corde ne
 * change pas la classe d'armure, et une clé inconnue du catalogue non plus.
 */
function toWornArmor(item: CatalogedItem | undefined): WornArmor | null {
  if (!item?.armor) return null;

  return {
    name: item.name,
    baseArmorClass: item.armor.baseArmorClass,
    dexterityAllowance: item.armor.dexterityAllowance,
    stealthDisadvantage: item.armor.stealthDisadvantage,
  };
}
