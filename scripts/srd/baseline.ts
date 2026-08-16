import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Divergence, DomainReport } from './divergence.ts';

/**
 * La baseline : les divergences déjà vues et déjà tranchées.
 *
 * Le SRD 5.2 de `5e-bits` s'étant révélé fautif (cf. PROVENANCE.md), l'audit ne
 * peut pas exiger zéro divergence — il en resterait quinze, toutes légitimes.
 * Il exige donc l'inverse : que la liste ne bouge pas. Une divergence qui
 * apparaît, disparaît ou change de valeur signale qu'on a touché à une
 * statistique du catalogue, et demande un arbitrage.
 */

/**
 * `srd-faux` : le SRD affirme une valeur fausse. `srd-incomplet` : il ne dit rien
 * là où le projet dit quelque chose. `projet-faux` : c'est le projet qui a tort,
 * et il reste à corriger. `non-tranche` : personne n'a encore regardé.
 */
export type Verdict = 'srd-faux' | 'srd-incomplet' | 'projet-faux' | 'non-tranche';

export type BaselineEntry = Divergence & { verdict: Verdict };

export type Drift = {
  appeared: Divergence[];
  disappeared: BaselineEntry[];
  changed: Divergence[];
};

const BASELINE_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../docs/characteres/srd-2024/audit-baseline.json',
);

const DEFAULT_VERDICT: Verdict = 'non-tranche';
const JSON_INDENT = 2;

export function readBaseline(): BaselineEntry[] {
  if (!existsSync(BASELINE_PATH)) return [];
  const parsed: unknown = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
  if (!Array.isArray(parsed)) throw new Error('audit-baseline.json doit être un tableau');
  return parsed as BaselineEntry[];
}

/** Un verdict déjà rendu se conserve : on ne rejuge pas une ligne inchangée. */
export function writeBaseline(divergences: Divergence[]): void {
  const previous = new Map(readBaseline().map((entry) => [identify(entry), entry.verdict]));
  const entries = divergences.map((divergence) => ({
    ...divergence,
    verdict: previous.get(identify(divergence)) ?? DEFAULT_VERDICT,
  }));
  writeFileSync(BASELINE_PATH, `${JSON.stringify(entries, null, JSON_INDENT)}\n`, 'utf8');
}

export function detectDrift(reports: DomainReport[]): Drift {
  const current = reports.flatMap((report) => report.divergences);
  const baseline = readBaseline();
  const currentByIdentity = new Map(current.map((d) => [identify(d), d]));
  const baselineByIdentity = new Map(baseline.map((d) => [identify(d), d]));

  return {
    appeared: current.filter((d) => !baselineByIdentity.has(identify(d))),
    disappeared: baseline.filter((d) => !currentByIdentity.has(identify(d))),
    changed: current.filter((d) => hasChangedValue(d, baselineByIdentity.get(identify(d)))),
  };
}

export function isStable(drift: Drift): boolean {
  return drift.appeared.length + drift.disappeared.length + drift.changed.length === 0;
}

export function describeDrift(drift: Drift): string {
  return [
    ...drift.appeared.map((d) => `  + nouvelle   ${label(d)} : projet ${d.project}, SRD ${d.srd}`),
    ...drift.disappeared.map((d) => `  - disparue   ${label(d)}`),
    ...drift.changed.map((d) => `  ~ modifiée   ${label(d)} : projet ${d.project}, SRD ${d.srd}`),
  ].join('\n');
}

function hasChangedValue(divergence: Divergence, previous: BaselineEntry | undefined): boolean {
  if (!previous) return false;
  return previous.project !== divergence.project || previous.srd !== divergence.srd;
}

function identify(divergence: Divergence): string {
  return `${divergence.domain}|${divergence.key}|${divergence.field}`;
}

function label(divergence: Divergence): string {
  return `${divergence.domain}/${divergence.key}.${divergence.field}`;
}
