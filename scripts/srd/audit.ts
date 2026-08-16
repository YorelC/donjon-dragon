import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { auditClasses } from './audit-classes.ts';
import { auditItems } from './audit-items.ts';
import { auditSpecies } from './audit-species.ts';
import { describeDrift, detectDrift, isStable, writeBaseline } from './baseline.ts';
import type { DomainReport, Divergence, Orphan } from './divergence.ts';

/**
 * L'audit de divergence : ce que le projet affirme, face à ce que le SRD 5.2
 * affirme, champ par champ.
 *
 * Il ne corrige rien et ne décide rien. Il produit la liste que Charly tranche
 * avant qu'une seule valeur soit réécrite — parce qu'entre les deux, c'est
 * parfois le SRD anglais qui a tort pour un projet francophone, et un script
 * n'a pas à en juger.
 */

const REPORT_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../docs/characteres/srd-2024/AUDIT.md',
);

const NO_SUGGESTION = '—';
const WRITE_BASELINE_FLAG = '--write-baseline';

const EXIT_STABLE = 0;
const EXIT_DRIFTED = 1;

function main(): void {
  const reports = [auditItems(), auditSpecies(), auditClasses()];
  writeFileSync(REPORT_PATH, render(reports), 'utf8');
  reports.forEach(logSummary);
  console.log(`\n📄 ${REPORT_PATH}`);
  process.exit(process.argv.includes(WRITE_BASELINE_FLAG) ? refresh(reports) : verify(reports));
}

function refresh(reports: DomainReport[]): number {
  writeBaseline(reports.flatMap((report) => report.divergences));
  console.log('📌 Baseline réécrite. Relire les verdicts « non-tranche ».');
  return EXIT_STABLE;
}

function verify(reports: DomainReport[]): number {
  const drift = detectDrift(reports);
  if (isStable(drift)) {
    console.log('✅ Catalogue stable : les divergences sont celles de la baseline.');
    return EXIT_STABLE;
  }
  console.error(`\n❌ Le catalogue a dérivé :\n${describeDrift(drift)}`);
  console.error(`\nSi c'est voulu, relancer avec ${WRITE_BASELINE_FLAG}.`);
  return EXIT_DRIFTED;
}

function render(reports: DomainReport[]): string {
  return [
    '# Audit de divergence — projet vs SRD 5.2',
    '',
    'Généré par `scripts/srd/audit.ts`. Ne pas éditer à la main.',
    '',
    ...reports.map(renderDomain),
  ].join('\n');
}

function renderDomain(report: DomainReport): string {
  return [
    `## ${report.domain}`,
    '',
    `${report.projectCount} côté projet, ${report.srdCount} côté SRD, ${report.matchedCount} appariés.`,
    '',
    renderDivergences(report.divergences),
    renderOrphans('Au projet, sans correspondance SRD', report.missingInSrd, true),
    renderOrphans('Au SRD, absents du projet', report.missingInProject, false),
  ].join('\n');
}

function renderDivergences(divergences: Divergence[]): string {
  if (divergences.length === 0) return `### Divergences\n\nAucune.\n`;
  const rows = divergences.map((d) => `| \`${d.key}\` | ${d.field} | ${d.project} | ${d.srd} |`);
  return [
    `### Divergences (${divergences.length})`,
    '',
    '| clé | champ | projet | SRD |',
    '|---|---|---|---|',
    ...rows,
    '',
  ].join('\n');
}

function renderOrphans(title: string, orphans: Orphan[], withSuggestion: boolean): string {
  if (orphans.length === 0) return `### ${title}\n\nAucun.\n`;
  return [
    `### ${title} (${orphans.length})`,
    '',
    ...(withSuggestion ? suggestionTable(orphans) : plainTable(orphans)),
    '',
  ].join('\n');
}

function suggestionTable(orphans: Orphan[]): string[] {
  return [
    '| clé projet | nom | candidat SRD |',
    '|---|---|---|',
    ...orphans.map((o) => `| \`${o.key}\` | ${o.name} | ${o.suggestion ?? NO_SUGGESTION} |`),
  ];
}

function plainTable(orphans: Orphan[]): string[] {
  return [
    '| clé SRD | nom |',
    '|---|---|',
    ...orphans.map((o) => `| \`${o.key}\` | ${o.name} |`),
  ];
}

function logSummary(report: DomainReport): string | void {
  console.log(
    `${report.domain} : ${report.divergences.length} divergences, ` +
      `${report.missingInSrd.length} non appariés, ${report.missingInProject.length} absents du projet`,
  );
}

main();
