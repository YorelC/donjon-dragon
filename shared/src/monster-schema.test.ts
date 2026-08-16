import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { MonsterSchema } from './monster-schema.js';

/**
 * Le schéma est confronté au bestiaire réel, sur disque.
 *
 * Un schéma de transport écrit à côté de sa donnée ne sert à rien : c'est la
 * seule façon de savoir qu'il décrit les 513 profils, et pas les trois qu'on
 * avait sous les yeux en l'écrivant.
 */

const BESTIARY_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../docs/characteres/bestiary/monsters.seed.json',
);

/** Le fichier ne porte pas la provenance : tout ce qu'il contient est du manuel. */
const SeededMonsterSchema = MonsterSchema.omit({ origin: true, campaignId: true });

const EXPECTED_COUNT = 513;

function readBestiary(): unknown[] {
  const parsed: unknown = JSON.parse(readFileSync(BESTIARY_PATH, 'utf8'));
  if (!Array.isArray(parsed)) throw new Error('monsters.seed.json doit être un tableau');
  return parsed;
}

describe('MonsterSchema face au bestiaire', () => {
  const bestiary = readBestiary();

  it('valide les 513 profils sans exception', () => {
    const failures = bestiary
      .map((monster) => ({ monster, result: SeededMonsterSchema.safeParse(monster) }))
      .filter((entry) => !entry.result.success)
      .map((entry) => (entry.monster as { key?: string }).key ?? 'sans clé');

    expect(failures).toEqual([]);
    expect(bestiary).toHaveLength(EXPECTED_COUNT);
  });

  it('n’a aucune clé en double : la clé est l’identité', () => {
    const keys = bestiary.map((monster) => (monster as { key: string }).key);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('refuse un profil sans classe d’armure', () => {
    const [first] = bestiary;
    const { armorClass: _removed, ...withoutArmorClass } = first as Record<string, unknown>;

    expect(SeededMonsterSchema.safeParse(withoutArmorClass).success).toBe(false);
  });

  it('exige un campaignId nul pour un profil du manuel', () => {
    const srdMonster = { ...(bestiary[0] as object), origin: 'srd', campaignId: null };

    expect(MonsterSchema.safeParse(srdMonster).success).toBe(true);
  });
});
