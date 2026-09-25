import type {
  CatalogEquipmentOption,
  CharacterItem,
  DndCatalog,
  FinalizeCharacterDto,
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

  for (const [option, choice] of chosenEquipmentWithChoices(catalog, composition)) {
    for (const entry of concreteEntries(option, choice)) {
      quantities.set(entry.itemKey, (quantities.get(entry.itemKey) ?? 0) + entry.quantity);
    }
  }

  const trinket = catalog.trinkets.find((entry) => entry.id === composition.trinketId);
  if (trinket) quantities.set(trinket.itemKey, (quantities.get(trinket.itemKey) ?? 0) + 1);

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
  const chosen = chosenEquipmentWithChoices(catalog, composition);

  return chosen.length === 2 && chosen.every(([option, choice]) => validChoice(option, choice));
}

/**
 * L'équipement envoyé au back. `items` et `gold` ne sont pas saisis : ils se
 * recalculent depuis les options retenues, pour que la composition n'ait qu'une
 * seule source de vérité — le choix, pas sa conséquence.
 */
export function equipmentPayloadOf(
  catalog: DndCatalog,
  composition: CharacterComposition,
): FinalizeCharacterDto["equipment"] {
  return {
    armorKey: composition.armorKey,
    shield: composition.shield,
    items: grantedItems(catalog, composition),
    gold: grantedGold(catalog, composition),
    classOptionId: composition.classEquipmentOptionId,
    backgroundOptionId: composition.backgroundEquipmentOptionId,
    classChoiceItemKey: composition.classChoiceItemKey,
    backgroundChoiceItemKey: composition.backgroundChoiceItemKey,
    trinketId: composition.trinketId,
  };
}

function chosenEquipmentWithChoices(
  catalog: DndCatalog,
  composition: CharacterComposition,
): Array<[CatalogEquipmentOption, string | null]> {
  const selected = [
    tupleOf(classEquipmentOptions(catalog, composition), composition.classEquipmentOptionId,
      composition.classChoiceItemKey),
    tupleOf(backgroundEquipmentOptions(catalog, composition), composition.backgroundEquipmentOptionId,
      composition.backgroundChoiceItemKey),
  ];

  return selected.filter((entry): entry is [CatalogEquipmentOption, string | null] => entry !== null);
}

function tupleOf(
  options: readonly CatalogEquipmentOption[],
  selectedId: string | null,
  choice: string | null,
): [CatalogEquipmentOption, string | null] | null {
  const option = options.find((entry) => entry.id === selectedId);

  return option ? [option, choice] : null;
}

function validChoice(option: CatalogEquipmentOption, choice: string | null): boolean {
  if (!option.itemChoice) return choice === null;

  return option.itemChoice.options.some((entry) => entry.key === choice);
}

function concreteEntries(option: CatalogEquipmentOption, choice: string | null): CharacterItem[] {
  const replaced = new Set(option.itemChoice?.replacesItemKeys ?? []);
  const entries = option.entries.filter((entry) => !replaced.has(entry.itemKey));

  return choice ? [...entries, { itemKey: choice, quantity: 1 }] : entries;
}
