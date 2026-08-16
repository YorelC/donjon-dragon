import type {
  CatalogEquipmentOption,
  CharacterItem,
  DndCatalog,
  Item,
} from "@donjon-dragon/shared";
import type { CharacterComposition } from "./character-composition";

/**
 * Le paquetage de départ, des options du catalogue vers l'inventaire réel.
 *
 * Le joueur choisit une option côté classe et une côté historique ; tout le
 * reste — ce qu'il possède, son or, l'armure qu'il peut porter — s'en déduit.
 * Rien de ce qui est calculé ici n'est stocké dans la composition : le choix est
 * la seule chose que le wizard retient.
 */

export function classEquipmentOptions(
  catalog: DndCatalog,
  composition: CharacterComposition,
): CatalogEquipmentOption[] {
  const characterClass = catalog.classes.find((entry) => entry.key === composition.classKey);
  return characterClass?.startingEquipment.options ?? [];
}

export function backgroundEquipmentOptions(
  catalog: DndCatalog,
  composition: CharacterComposition,
): CatalogEquipmentOption[] {
  const background = catalog.backgrounds.find((entry) => entry.key === composition.backgroundKey);
  return background?.equipment.options ?? [];
}

/** Les deux options retenues, ou moins tant que le joueur n'a pas tranché. */
export function chosenEquipmentOptions(
  catalog: DndCatalog,
  composition: CharacterComposition,
): CatalogEquipmentOption[] {
  const chosen = [
    classEquipmentOptions(catalog, composition).find(
      (option) => option.id === composition.classEquipmentOptionId,
    ),
    backgroundEquipmentOptions(catalog, composition).find(
      (option) => option.id === composition.backgroundEquipmentOptionId,
    ),
  ];

  return chosen.filter((option): option is CatalogEquipmentOption => option !== undefined);
}

/** L'inventaire résultant : les deux options fusionnées, quantités cumulées. */
export function grantedItems(
  catalog: DndCatalog,
  composition: CharacterComposition,
): CharacterItem[] {
  const quantities = new Map<string, number>();

  for (const option of chosenEquipmentOptions(catalog, composition)) {
    for (const entry of option.entries) {
      quantities.set(entry.itemKey, (quantities.get(entry.itemKey) ?? 0) + entry.quantity);
    }
  }

  return [...quantities].map(([itemKey, quantity]) => ({ itemKey, quantity }));
}

export function grantedGold(catalog: DndCatalog, composition: CharacterComposition): number {
  return chosenEquipmentOptions(catalog, composition).reduce(
    (total, option) => total + option.gold,
    0,
  );
}

/**
 * Les armures que le paquetage donne : on ne porte que ce qu'on possède.
 *
 * Elles sont cherchées dans le catalogue d'objets et non dans celui des règles —
 * c'est ce qui fera apparaître, sans rien changer ici, une armure inventée par
 * un MJ.
 */
export function ownedArmors(items: Item[], granted: CharacterItem[]): Item[] {
  const owned = new Set(granted.map((item) => item.itemKey));
  return items.filter((item) => item.armor !== null && owned.has(item.key));
}

export const SHIELD_ITEM_KEY = "shield";

export function ownedShield(items: Item[], granted: CharacterItem[]): Item | null {
  const carried = granted.some((item) => item.itemKey === SHIELD_ITEM_KEY);
  if (!carried) return null;

  return items.find((item) => item.key === SHIELD_ITEM_KEY) ?? null;
}

/** Les deux paquetages sont-ils choisis ? C'est ce qui rend l'étape valide. */
export function hasChosenEquipment(
  catalog: DndCatalog,
  composition: CharacterComposition,
): boolean {
  return chosenEquipmentOptions(catalog, composition).length === 2;
}
