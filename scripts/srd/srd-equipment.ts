import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { SrdCost } from './units.ts';

/**
 * La forme du SRD 5.2 tel que `5e-bits/5e-database` le publie.
 *
 * On la décrit ici plutôt que de la consommer telle quelle : c'est un payload
 * d'API REST, où toute référence est `{index, name, url}`. Ces types marquent la
 * frontière — au-delà, plus rien ne parle SRD, tout parle le vocabulaire du
 * projet.
 */

export type SrdRef = { index: string; name: string; url?: string; note?: string };

export type SrdDamage = { damage_dice: string; damage_type: SrdRef };

export type SrdRange = { normal: number; long?: number };

export type SrdArmorClass = { base: number; dex_bonus: boolean; max_bonus?: number };

export type SrdContent = { item: SrdRef; quantity: number };

export type SrdEquipment = {
  index: string;
  name: string;
  equipment_categories: SrdRef[];
  cost: SrdCost;
  weight?: number;
  description?: string;
  damage?: SrdDamage;
  two_handed_damage?: SrdDamage;
  range?: SrdRange;
  throw_range?: SrdRange;
  properties?: SrdRef[];
  mastery?: SrdRef;
  armor_class?: SrdArmorClass;
  str_minimum?: number;
  stealth_disadvantage?: boolean;
  contents?: SrdContent[];
};

const VENDORED_DIRECTORY = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../docs/characteres/srd-2024',
);

export function readSrdFile<T>(fileName: string): T[] {
  const parsed: unknown = JSON.parse(readFileSync(resolve(VENDORED_DIRECTORY, fileName), 'utf8'));
  if (!Array.isArray(parsed)) throw new Error(`${fileName} doit être un tableau`);
  return parsed as T[];
}

export function readSrdEquipment(): SrdEquipment[] {
  return readSrdFile<SrdEquipment>('5e-SRD-Equipment.json');
}
