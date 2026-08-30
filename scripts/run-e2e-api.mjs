#!/usr/bin/env node
/**
 * Lance la collection Bruno, puis rend l'instance Mongo propre.
 *
 * Le nettoyage court meme quand la collection echoue : une base laissee derriere
 * est un piege pour l'execution suivante, pas une trace utile. Pour garder l'etat
 * et l'inspecter, exporter `KEEP_E2E_DB=1`.
 */
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Sortie standard de `bru run` en echec fonctionnel. */
const TEST_FAILURE = 1;

main();

function main() {
  const status = runCollection();
  if (process.env.KEEP_E2E_DB === '1') console.log('KEEP_E2E_DB=1 : bases E2E conservees.');
  else dropDatabases();

  process.exit(status ?? TEST_FAILURE);
}

function runCollection() {
  return exec('bru', ['run', '--env', 'Local', '--tests-only', '--bail'], join(ROOT, 'e2e/bruno'));
}

function dropDatabases() {
  exec(process.execPath, [join(ROOT, 'scripts/drop-e2e-databases.mjs')], ROOT);
}

function exec(command, args, cwd) {
  return spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  }).status;
}
