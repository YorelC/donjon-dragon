import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Item } from '@donjon-dragon/shared/item-schema';

import type { Comparator } from './compare.ts';
import { compareEntry } from './compare.ts';
import type { Divergence, DomainReport, Orphan } from './divergence.ts';
import { findSrdMatch, indexSrdByNormalizedKey, suggestByFingerprint } from './item-keys.ts';
import type { SrdEquipment } from './srd-equipment.ts';
import { readSrdEquipment } from './srd-equipment.ts';
import { toArmorStats, toItemType, toWeaponStats } from './to-item.ts';
import { toCopper, toKilograms } from './units.ts';

const DOMAIN = 'items';

const CATALOG_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../docs/characteres/equipment/items.seed.json',
);

const COMPARATORS: Comparator<Item, SrdEquipment>[] = [
  { field: 'type', ofProject: (i) => i.type, ofSrd: toItemType },
  { field: 'costInCopper', ofProject: (i) => i.costInCopper, ofSrd: (e) => toCopper(e.cost) },
  { field: 'weightInKg', ofProject: (i) => i.weightInKg, ofSrd: (e) => toKilograms(e.weight) },
  { field: 'weapon.category', ofProject: (i) => i.weapon?.category, ofSrd: (e) => toWeaponStats(e)?.category },
  { field: 'weapon.kind', ofProject: (i) => i.weapon?.kind, ofSrd: (e) => toWeaponStats(e)?.kind },
  { field: 'weapon.damageDice', ofProject: (i) => i.weapon?.damageDice, ofSrd: (e) => toWeaponStats(e)?.damageDice },
  { field: 'weapon.damageType', ofProject: (i) => i.weapon?.damageType, ofSrd: (e) => toWeaponStats(e)?.damageType },
  { field: 'weapon.versatileDice', ofProject: (i) => i.weapon?.versatileDice, ofSrd: (e) => toWeaponStats(e)?.versatileDice },
  { field: 'weapon.range', ofProject: (i) => i.weapon?.range, ofSrd: (e) => toWeaponStats(e)?.range },
  { field: 'weapon.properties', ofProject: (i) => i.weapon?.properties, ofSrd: (e) => toWeaponStats(e)?.properties },
  { field: 'weapon.mastery', ofProject: (i) => i.weapon?.mastery, ofSrd: (e) => toWeaponStats(e)?.mastery },
  { field: 'armor.training', ofProject: (i) => i.armor?.training, ofSrd: (e) => toArmorStats(e)?.training },
  { field: 'armor.baseArmorClass', ofProject: (i) => i.armor?.baseArmorClass, ofSrd: (e) => toArmorStats(e)?.baseArmorClass },
  { field: 'armor.dexterityAllowance', ofProject: (i) => i.armor?.dexterityAllowance, ofSrd: (e) => toArmorStats(e)?.dexterityAllowance },
  { field: 'armor.strengthRequirement', ofProject: (i) => i.armor?.strengthRequirement, ofSrd: (e) => toArmorStats(e)?.strengthRequirement },
  { field: 'armor.stealthDisadvantage', ofProject: (i) => i.armor?.stealthDisadvantage, ofSrd: (e) => toArmorStats(e)?.stealthDisadvantage },
];

export function auditItems(): DomainReport {
  const items = readCatalog();
  const equipment = readSrdEquipment();
  const srdByKey = indexSrdByNormalizedKey(equipment);
  const matched = new Map<Item, SrdEquipment>();
  const unmatched: Item[] = [];

  items.forEach((item) => assign(item, findSrdMatch(item, srdByKey), matched, unmatched));

  return {
    domain: DOMAIN,
    projectCount: items.length,
    srdCount: equipment.length,
    matchedCount: matched.size,
    divergences: [...matched].flatMap(([item, srd]) => compare(item, srd)),
    missingInSrd: unmatched.map((item) => toOrphan(item, equipment)),
    missingInProject: listMissingInProject(equipment, [...matched.values()]),
  };
}

function assign(
  item: Item,
  match: SrdEquipment | null,
  matched: Map<Item, SrdEquipment>,
  unmatched: Item[],
): void {
  if (match) matched.set(item, match);
  else unmatched.push(item);
}

function compare(item: Item, srd: SrdEquipment): Divergence[] {
  return compareEntry({ domain: DOMAIN, key: item.key }, { project: item, srd }, COMPARATORS);
}

function toOrphan(item: Item, equipment: SrdEquipment[]): Orphan {
  const candidate = suggestByFingerprint(item, equipment);
  return {
    domain: DOMAIN,
    key: item.key,
    name: item.name,
    suggestion: candidate ? `${candidate.index} (${candidate.name})` : null,
  };
}

function listMissingInProject(equipment: SrdEquipment[], consumed: SrdEquipment[]): Orphan[] {
  const used = new Set(consumed.map((entry) => entry.index));
  return equipment
    .filter((entry) => !used.has(entry.index))
    .map((entry) => ({ domain: DOMAIN, key: entry.index, name: entry.name, suggestion: null }));
}

function readCatalog(): Item[] {
  const parsed: unknown = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  if (!Array.isArray(parsed)) throw new Error('items.seed.json doit être un tableau');
  return parsed as Item[];
}
