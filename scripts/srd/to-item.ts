import type {
  DamageType,
  WeaponMastery,
  WeaponProperty,
} from '@donjon-dragon/shared/dnd-reference-schema';
import type { ArmorStats, ItemType, WeaponRange, WeaponStats } from '@donjon-dragon/shared/item-schema';

import type { SrdArmorClass, SrdEquipment, SrdRef } from './srd-equipment.ts';
import { toMeters } from './units.ts';

/**
 * Le SRD traduit dans le vocabulaire du projet.
 *
 * C'est le seul endroit qui connaît les deux langues à la fois. Une fois passé
 * ici, une arme n'a plus de `two_handed_damage` ni d'`equipment_categories` :
 * elle a des dés polyvalents et un type.
 */

const ITEM_TYPE_BY_CATEGORY: Record<string, ItemType> = {
  'equipment-packs': 'pack',
  shields: 'armor',
  armor: 'armor',
  weapons: 'weapon',
  tools: 'tool',
};

/** L'ordre compte : un bouclier est aussi rangé dans `armor`, un paquetage dans `adventuring-gear`. */
const CATEGORY_PRIORITY = ['equipment-packs', 'shields', 'armor', 'weapons', 'tools'] as const;

const DEFAULT_ITEM_TYPE: ItemType = 'gear';

export function toItemType(equipment: SrdEquipment): ItemType {
  const categories = indexesOf(equipment.equipment_categories);
  const matched = CATEGORY_PRIORITY.find((category) => categories.has(category));
  return matched ? ITEM_TYPE_BY_CATEGORY[matched] : DEFAULT_ITEM_TYPE;
}

const WEAPON_PROPERTY_BY_INDEX: Record<string, WeaponProperty> = {
  ammunition: 'ammunition',
  finesse: 'finesse',
  heavy: 'heavy',
  light: 'light',
  loading: 'loading',
  reach: 'reach',
  thrown: 'thrown',
  'two-handed': 'twoHanded',
  versatile: 'versatile',
};

export function toWeaponStats(equipment: SrdEquipment): WeaponStats | null {
  if (!equipment.damage) return null;
  const categories = indexesOf(equipment.equipment_categories);
  return {
    category: categories.has('martial-weapons') ? 'martial' : 'simple',
    kind: categories.has('ranged-weapons') ? 'ranged' : 'melee',
    damageDice: equipment.damage.damage_dice,
    damageType: equipment.damage.damage_type.index as DamageType,
    versatileDice: equipment.two_handed_damage?.damage_dice ?? null,
    range: toWeaponRange(equipment),
    properties: toWeaponProperties(equipment.properties ?? []),
    mastery: (equipment.mastery?.index ?? null) as WeaponMastery | null,
  };
}

/**
 * Une arme de mêlée porte `range.normal` comme allonge, sans `long` : ce n'est
 * pas une portée. Seul un couple normal/long en est une, qu'il vienne du tir ou
 * du lancer.
 */
export function toWeaponRange(equipment: SrdEquipment): WeaponRange | null {
  const measured = equipment.throw_range ?? equipment.range;
  if (!measured?.long) return null;
  return { normal: toMeters(measured.normal), max: toMeters(measured.long) };
}

function toWeaponProperties(properties: SrdRef[]): WeaponProperty[] {
  return properties.map((property) => {
    const known = WEAPON_PROPERTY_BY_INDEX[property.index];
    if (!known) throw new Error(`Propriété d'arme inconnue dans le SRD : ${property.index}`);
    return known;
  });
}

const ARMOR_TRAINING_BY_CATEGORY: Record<string, ArmorStats['training']> = {
  'light-armor': 'light',
  'medium-armor': 'medium',
  'heavy-armor': 'heavy',
  shields: 'shields',
};

export function toArmorStats(equipment: SrdEquipment): ArmorStats | null {
  if (!equipment.armor_class) return null;
  return {
    training: toArmorTraining(equipment),
    baseArmorClass: equipment.armor_class.base,
    dexterityAllowance: toDexterityAllowance(equipment.armor_class),
    strengthRequirement: equipment.str_minimum || null,
    stealthDisadvantage: equipment.stealth_disadvantage ?? false,
  };
}

function toArmorTraining(equipment: SrdEquipment): ArmorStats['training'] {
  const categories = indexesOf(equipment.equipment_categories);
  const matched = Object.keys(ARMOR_TRAINING_BY_CATEGORY).find((category) =>
    categories.has(category),
  );
  if (!matched) throw new Error(`Entraînement d'armure introuvable pour ${equipment.index}`);
  return ARMOR_TRAINING_BY_CATEGORY[matched];
}

function toDexterityAllowance(armorClass: SrdArmorClass): ArmorStats['dexterityAllowance'] {
  if (!armorClass.dex_bonus) return 'none';
  return armorClass.max_bonus === undefined ? 'full' : 'capped';
}

function indexesOf(references: SrdRef[]): Set<string> {
  return new Set(references.map((reference) => reference.index));
}
