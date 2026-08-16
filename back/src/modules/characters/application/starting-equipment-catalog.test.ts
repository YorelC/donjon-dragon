import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

import { BACKGROUNDS } from '../domain/reference/backgrounds';
import { CLASSES } from '../domain/reference/classes';
import type { StartingEquipment } from '../domain/reference/starting-equipment';

/**
 * Les paquetages de départ référencent des objets par leur clé, et ces objets
 * vivent dans une collection Mongo alimentée par ce fichier. Rien ne relie les
 * deux à la compilation : une clé mal recopiée ne se verrait qu'à l'écran, sur
 * une ligne d'inventaire vide. Ce test est ce lien.
 *
 * Il n'est pas posé à côté de `domain/reference/starting-equipment.ts` parce
 * qu'il lit un fichier, et que `no-node-builtins-in-domain` vaut aussi pour les
 * tests. C'est bien la couche application qui publie ces paquetages, via
 * `dnd-catalog.mapper.ts` : la vérification est à sa place ici.
 */
const CATALOG_PATH = resolve(
  __dirname,
  '../../../../../docs/characteres/equipment/items.seed.json',
);

interface CatalogEntry {
  key: string;
}

const catalogKeys = new Set(
  (JSON.parse(readFileSync(CATALOG_PATH, 'utf8')) as CatalogEntry[]).map((item) => item.key),
);

const packages: [string, StartingEquipment][] = [
  ...Object.values(CLASSES).map(
    (entry): [string, StartingEquipment] => [`classe ${entry.key}`, entry.startingEquipment],
  ),
  ...Object.values(BACKGROUNDS).map(
    (entry): [string, StartingEquipment] => [`historique ${entry.key}`, entry.equipment],
  ),
];

describe('Paquetages de départ — cohérence avec le catalogue d objets', () => {
  it('couvre les 12 classes et les 16 historiques', () => {
    expect(packages).toHaveLength(28);
  });

  it.each(packages)('%s ne référence que des objets du catalogue', (_label, equipment) => {
    const unknown = equipment.options
      .flatMap((option) => option.entries)
      .map((entry) => entry.itemKey)
      .filter((itemKey) => !catalogKeys.has(itemKey));

    expect(unknown).toEqual([]);
  });

  it.each(packages)('%s propose au moins deux options, dont une tout en or', (_label, equipment) => {
    expect(equipment.options.length).toBeGreaterThanOrEqual(2);
    expect(equipment.options.some((option) => option.entries.length === 0)).toBe(true);
  });

  it.each(packages)('%s donne des identifiants d option distincts', (_label, equipment) => {
    const ids = equipment.options.map((option) => option.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('donne trois options au guerrier, et à lui seul', () => {
    const threeWayChoices = Object.values(CLASSES)
      .filter((entry) => entry.startingEquipment.options.length === 3)
      .map((entry) => entry.key);

    expect(threeWayChoices).toEqual(['fighter']);
  });
});
