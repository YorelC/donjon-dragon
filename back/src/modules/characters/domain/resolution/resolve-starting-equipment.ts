import { InvalidDomainError } from '@kernel/domain/domain.error';

import type { CharacterEquipmentSnapshot } from '../character-equipment';
import { BACKGROUNDS } from '../reference/backgrounds';
import { CLASSES } from '../reference/classes';
import {
  ARTISAN_TOOLS,
  GAMING_SETS,
  MUSICAL_INSTRUMENTS,
  isTrinketId,
  trinketKey,
} from '../reference/creation-options';
import type { BackgroundKey, ClassKey } from '../reference/keys';
import type { EquipmentEntry, EquipmentOption } from '../reference/starting-equipment';

export class InvalidStartingEquipmentError extends InvalidDomainError {
  constructor() {
    super('Starting equipment does not match the selected class and background');
  }
}

type EquipmentSelection = Pick<
  CharacterEquipmentSnapshot,
  | 'armorKey'
  | 'shield'
  | 'classOptionId'
  | 'backgroundOptionId'
  | 'classChoiceItemKey'
  | 'backgroundChoiceItemKey'
  | 'trinketId'
>;

const CLASS_CHOICE_CATALOG: Partial<Record<ClassKey, readonly string[]>> = {
  bard: MUSICAL_INSTRUMENTS,
  monk: [...ARTISAN_TOOLS, ...MUSICAL_INSTRUMENTS],
};

const BACKGROUND_CHOICE_CATALOG: Partial<Record<BackgroundKey, readonly string[]>> = {
  artisan: ARTISAN_TOOLS,
  entertainer: MUSICAL_INSTRUMENTS,
  guard: GAMING_SETS,
  noble: GAMING_SETS,
  soldier: GAMING_SETS,
};

const GENERIC_ITEM_KEYS = new Set(['musical-instrument', 'gaming-set']);

export function resolveStartingEquipment(
  classKey: ClassKey,
  backgroundKey: BackgroundKey,
  selection: EquipmentSelection,
): CharacterEquipmentSnapshot {
  const classOption = findOption(CLASSES[classKey].startingEquipment.options, selection.classOptionId);
  const backgroundOption = findOption(
    BACKGROUNDS[backgroundKey].equipment.options,
    selection.backgroundOptionId,
  );
  const entries = entriesFor(classOption, backgroundOption, classKey, backgroundKey, selection);
  const trinketId = validatedTrinket(selection.trinketId ?? null);
  return {
    ...selection,
    classOptionId: classOption.id,
    backgroundOptionId: backgroundOption.id,
    classChoiceItemKey: selection.classChoiceItemKey ?? null,
    backgroundChoiceItemKey: selection.backgroundChoiceItemKey ?? null,
    trinketId,
    items: mergeEntries(addTrinket(entries, trinketId)),
    gold: classOption.gold + backgroundOption.gold,
  };
}

function findOption(
  options: readonly EquipmentOption[],
  id: string | null,
): EquipmentOption {
  const option = options.find((candidate) => candidate.id === id);
  if (!option) throw new InvalidStartingEquipmentError();
  return option;
}

function entriesFor(
  classOption: EquipmentOption,
  backgroundOption: EquipmentOption,
  classKey: ClassKey,
  backgroundKey: BackgroundKey,
  selection: EquipmentSelection,
): EquipmentEntry[] {
  const classEntries = concreteEntries(
    classOption,
    CLASS_CHOICE_CATALOG[classKey],
    selection.classChoiceItemKey ?? null,
  );
  const backgroundEntries = concreteEntries(
    backgroundOption,
    BACKGROUND_CHOICE_CATALOG[backgroundKey],
    selection.backgroundChoiceItemKey ?? null,
  );
  return [...classEntries, ...backgroundEntries];
}

function concreteEntries(
  option: EquipmentOption,
  catalog: readonly string[] | undefined,
  chosen: string | null,
): EquipmentEntry[] {
  const grantsObjects = option.entries.length > 0;
  if (!catalog) return requireNoChoice(option.entries, chosen);
  if (!grantsObjects) return requireNoChoice(option.entries, chosen);
  if (!chosen || !catalog.includes(chosen)) throw new InvalidStartingEquipmentError();
  return [...withoutGeneric(option.entries), { itemKey: chosen, quantity: 1 }];
}

function requireNoChoice(entries: readonly EquipmentEntry[], chosen: string | null): EquipmentEntry[] {
  if (chosen) throw new InvalidStartingEquipmentError();
  return withoutGeneric(entries);
}

function withoutGeneric(entries: readonly EquipmentEntry[]): EquipmentEntry[] {
  return entries.filter((entry) => !GENERIC_ITEM_KEYS.has(entry.itemKey)).map(copyEntry);
}

function validatedTrinket(id: number | null): number | null {
  if (id === null || isTrinketId(id)) return id;
  throw new InvalidStartingEquipmentError();
}

function addTrinket(entries: EquipmentEntry[], id: number | null): EquipmentEntry[] {
  return id === null ? entries : [...entries, { itemKey: trinketKey(id), quantity: 1 }];
}

function mergeEntries(entries: readonly EquipmentEntry[]): EquipmentEntry[] {
  const quantities = new Map<string, number>();
  entries.forEach((entry) => {
    quantities.set(entry.itemKey, (quantities.get(entry.itemKey) ?? 0) + entry.quantity);
  });
  return [...quantities].map(([itemKey, quantity]) => ({ itemKey, quantity }));
}

function copyEntry(entry: EquipmentEntry): EquipmentEntry {
  return { ...entry };
}
