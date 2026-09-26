import type { CatalogEquipmentOption, DndCatalog, Item } from "@donjon-dragon/shared";
import type { CharacterComposition } from "./character-composition";
import {
  backgroundEquipmentOptions,
  classEquipmentOptions,
  grantedGold,
  grantedItems,
} from "./starting-equipment";
import {
  itemsBlock,
  presentBlocks,
  type DetailItem,
  type DetailSource,
  type StepDetail,
} from "./step-detail-parts";

const PENDING = "À choisir";
const KEY_SEPARATOR = ":";

export const EQUIPMENT_GROUP_TITLES = {
  class: "Paquetage de classe",
  background: "Paquetage d'historique",
} as const;

export type EquipmentGroup = keyof typeof EQUIPMENT_GROUP_TITLES;

type OptionsReader = (catalog: DndCatalog, composition: CharacterComposition) => CatalogEquipmentOption[];

const OPTIONS_OF: Record<EquipmentGroup, OptionsReader> = {
  class: classEquipmentOptions,
  background: backgroundEquipmentOptions,
};

/** Classe et historique proposent les mêmes libellés d'option : la clé porte son groupe. */
export function equipmentFocusKey(group: EquipmentGroup, optionId: string): string {
  return `${group}${KEY_SEPARATOR}${optionId}`;
}

/** L'option survolée et son contenu ; sans survol, les deux paquetages retenus. */
export function equipmentDetail(source: DetailSource): StepDetail {
  const focused = focusedOptionOf(source);
  if (focused) return optionDetail(source.items, focused);

  return equipmentOverview(source);
}

interface FocusedOption {
  group: EquipmentGroup;
  option: CatalogEquipmentOption;
}

function focusedOptionOf({ context, focusKey }: DetailSource): FocusedOption | null {
  const [group, optionId] = focusKey?.split(KEY_SEPARATOR) ?? [];
  if (group !== "class" && group !== "background") return null;
  const option = OPTIONS_OF[group](context.catalog, context.composition)
    .find((entry) => entry.id === optionId);

  return option ? { group, option } : null;
}

function optionDetail(items: Item[], { group, option }: FocusedOption): StepDetail {
  return {
    kicker: EQUIPMENT_GROUP_TITLES[group],
    title: `Option ${option.id}`,
    lede: option.label,
    badges: option.gold > 0 ? [{ label: "Or", value: `${option.gold} po` }] : [],
    blocks: presentBlocks([
      option.entries.length > 0 ? itemsBlock("Contenu", option.entries.map((entry) => itemLine(items, entry))) : null,
    ]),
  };
}

function equipmentOverview({ context, items }: DetailSource): StepDetail {
  const { catalog, composition } = context;
  const inventory = grantedItems(catalog, composition).map((entry) => itemLine(items, entry));

  return {
    kicker: "Équipement",
    title: "Équipement de départ",
    lede: null,
    badges: [{ label: "Or", value: `${grantedGold(catalog, composition)} po` }],
    blocks: presentBlocks([
      itemsBlock("Vos paquetages", [
        { name: EQUIPMENT_GROUP_TITLES.class, text: retainedLabel(OPTIONS_OF.class(catalog, composition), composition.classEquipmentOptionId) },
        { name: EQUIPMENT_GROUP_TITLES.background, text: retainedLabel(OPTIONS_OF.background(catalog, composition), composition.backgroundEquipmentOptionId) },
      ]),
      inventory.length > 0 ? itemsBlock("Inventaire", inventory) : null,
    ]),
  };
}

function retainedLabel(options: CatalogEquipmentOption[], optionId: string | null): string {
  const option = options.find((entry) => entry.id === optionId);

  return option ? `Option ${option.id} — ${option.label}` : PENDING;
}

function itemLine(items: Item[], entry: { itemKey: string; quantity: number }): DetailItem {
  const name = items.find((item) => item.key === entry.itemKey)?.name ?? entry.itemKey;

  return { name, text: entry.quantity > 1 ? `× ${entry.quantity}` : "" };
}
