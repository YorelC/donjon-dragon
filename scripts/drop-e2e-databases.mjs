#!/usr/bin/env node
/**
 * Balai des bases jetables de l'E2E API.
 *
 * La collection Bruno tourne dans la sandbox sure : elle n'a ni systeme de
 * fichiers ni driver Mongo, donc elle ne peut pas se nettoyer elle-meme. Chaque
 * execution laissait une base `donjon-dragon-e2e-*` de plus dans l'instance de
 * developpement, jusqu'a noyer la vraie base dans la liste.
 *
 * Le prefixe est la seule protection, et il est volontairement strict : la base
 * de travail `donjon-dragon` ne le porte pas et ne peut donc pas etre atteinte.
 */
import { spawnSync } from 'node:child_process';

/** Seul espace de noms considere comme jetable. */
const DISPOSABLE_PREFIX = 'donjon-dragon-e2e-';

/** Sans replica set ni connexion directe, le driver cherche `mongo:27017` depuis l'hote. */
const ADMIN_URI = 'mongodb://localhost:27017/?directConnection=true';

main();

function main() {
  const names = disposableDatabases();
  if (names.length === 0) return console.log('Aucune base E2E a supprimer.');

  names.forEach(drop);
  console.log(`${names.length} base(s) E2E supprimee(s).`);
}

function disposableDatabases() {
  const listing = evaluate(
    `JSON.stringify(db.adminCommand({ listDatabases: 1, nameOnly: true }).databases.map((d) => d.name))`,
  );

  return JSON.parse(listing).filter((name) => name.startsWith(DISPOSABLE_PREFIX));
}

function drop(name) {
  evaluate(`db.getSiblingDB(${JSON.stringify(name)}).dropDatabase()`);
  console.log(`  supprimee : ${name}`);
}

function evaluate(script) {
  // Sans `shell`, volontairement : Windows deferait les guillemets de `--eval`, et
  // par stdin mongosh passe en REPL et prefixe sa sortie de son invite.
  const run = spawnSync('mongosh', [ADMIN_URI, '--quiet', '--eval', script], {
    encoding: 'utf8',
  });

  if (run.status !== 0) throw new Error(mongoshFailure(run));
  return run.stdout.trim();
}

function mongoshFailure({ error, stderr, stdout }) {
  if (error?.code === 'ENOENT') return 'mongosh introuvable dans le PATH.';
  return `mongosh a echoue : ${(stderr || stdout || '').trim()}`;
}
