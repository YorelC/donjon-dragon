import { SPECIES } from '../../back/src/modules/characters/domain/reference/species';

import type { Comparator } from './compare.ts';
import { compareEntry } from './compare.ts';
import type { Divergence, DomainReport, Orphan } from './divergence.ts';
import type { SrdSpecies } from './srd-reference.ts';
import { readSrdSpecies } from './srd-reference.ts';
import { toDarkvisionMeters } from './to-reference.ts';
import { toMeters } from './units.ts';

/**
 * Les 9 espèces, projet contre SRD.
 *
 * Les lignées se comparent en nombre et non en clés : le SRD les préfixe du nom
 * du groupe (`elven-lineage-drow` pour `drow`), et sur le goliath il nomme le
 * trait quand le projet nomme le géant (`giant-ancestry-clouds-jaunt` contre
 * `cloud-giant`). Comparer les clés ne dirait rien d'autre que ça. Un écart de
 * nombre, lui, signale une lignée manquante.
 */

type ProjectSpecies = (typeof SPECIES)[keyof typeof SPECIES];

const DOMAIN = 'species';
const NO_LINEAGE = 0;

const COMPARATORS: Comparator<ProjectSpecies, SrdSpecies>[] = [
  { field: 'size', ofProject: (s) => s.size, ofSrd: (s) => s.size },
  { field: 'speed', ofProject: (s) => s.speed, ofSrd: (s) => toMeters(s.speed) },
  { field: 'darkvision', ofProject: (s) => s.darkvision, ofSrd: toDarkvisionMeters },
  { field: 'lineage.count', ofProject: countLineages, ofSrd: (s) => s.subspecies?.length ?? NO_LINEAGE },
];

export function auditSpecies(): DomainReport {
  const project = Object.values(SPECIES);
  const srd = readSrdSpecies();
  const srdByKey = new Map(srd.map((entry) => [entry.index, entry]));
  const matched = project.filter((species) => srdByKey.has(species.key));

  return {
    domain: DOMAIN,
    projectCount: project.length,
    srdCount: srd.length,
    matchedCount: matched.length,
    divergences: matched.flatMap((species) => compare(species, srdByKey.get(species.key)!)),
    missingInSrd: project.filter((s) => !srdByKey.has(s.key)).map(toProjectOrphan),
    missingInProject: srd.filter((s) => !(s.index in SPECIES)).map(toSrdOrphan),
  };
}

function compare(species: ProjectSpecies, srd: SrdSpecies): Divergence[] {
  return compareEntry({ domain: DOMAIN, key: species.key }, { project: species, srd }, COMPARATORS);
}

function countLineages(species: ProjectSpecies): number {
  return species.lineage?.options.length ?? NO_LINEAGE;
}

function toProjectOrphan(species: ProjectSpecies): Orphan {
  return { domain: DOMAIN, key: species.key, name: species.name, suggestion: null };
}

function toSrdOrphan(species: SrdSpecies): Orphan {
  return { domain: DOMAIN, key: species.index, name: species.name, suggestion: null };
}
