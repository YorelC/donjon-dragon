#!/usr/bin/env node
/**
 * Execute l'E2E API de bout en bout : une base jetable, les seeds, le backend,
 * la collection Bruno, puis le balai.
 *
 * L'URI de la base n'appartient qu'a ce script : ni `.env` ni le terminal n'ont
 * a bouger pour tester. `@nestjs/config` laisse `process.env` primer sur le
 * fichier `.env`, c'est ce qui permet de viser la base jetable sans toucher a la
 * configuration de developpement.
 *
 * `KEEP_E2E_DB=1` conserve les bases pour inspection. `E2E_MONGODB_URI` impose
 * une URI precise au lieu de la generer — a n'utiliser que sur une base jetable,
 * le balai ne supprimant que le prefixe convenu.
 */
import { spawn, spawnSync } from 'node:child_process';
import { connect } from 'node:net';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Sortie standard de `bru run` en echec fonctionnel. */
const TEST_FAILURE = 1;

/** Le port qu'attend `baseUrl` de l'environnement Bruno. */
const E2E_PORT = '3000';

/** Seul espace de noms que le balai accepte de supprimer. */
const DISPOSABLE_PREFIX = 'donjon-dragon-e2e-';

const MONGO_HOST = 'mongodb://localhost:27017';
const REPLICA_SET_QUERY = 'replicaSet=donjonDragon&directConnection=true';

const READY_TIMEOUT_MS = 180_000;
const PROBE_INTERVAL_MS = 500;

/** Nommer l'occupant du port depend de l'outillage reseau du systeme. */
const OCCUPANT_LOOKUP = {
  win32: () => windowsOccupant(),
  default: () => unixOccupant(),
};

await main();

async function main() {
  const uri = process.env.E2E_MONGODB_URI ?? disposableUri();
  console.log(`Base E2E : ${databaseNameOf(uri)}`);

  const status = await runAgainst(uri);
  if (process.env.KEEP_E2E_DB === '1') console.log('KEEP_E2E_DB=1 : bases E2E conservees.');
  else dropDatabases();

  process.exit(status ?? TEST_FAILURE);
}

/**
 * Le backend est arrete quoi qu'il arrive : une collection en echec ne doit pas
 * laisser un serveur accroche au port et une base pleine derriere elle.
 */
async function runAgainst(uri) {
  await assertPortIsFree();
  seedDatabase(uri);
  const backend = startBackend(uri);
  try {
    await waitUntilListening(backend);
    return runCollection();
  } finally {
    stop(backend);
  }
}

/** Une base par execution : deux runs ne se marchent jamais dessus. */
function disposableUri() {
  return `${MONGO_HOST}/${DISPOSABLE_PREFIX}${Date.now()}?${REPLICA_SET_QUERY}`;
}

function databaseNameOf(uri) {
  return new URL(uri.replace('mongodb://', 'http://')).pathname.slice(1);
}

/** Les comptes de la collection, puis le catalogue d'objets. L'ordre compte. */
function seedDatabase(uri) {
  ['seed', 'seed:items'].forEach((script) => {
    const status = exec('pnpm', ['--filter', 'back', script], ROOT, environmentFor(uri));
    if (status !== 0) throw new Error(`Le seed « ${script} » a echoue.`);
  });
}

/**
 * `nest start` sans `--watch` : la surveillance de fichiers recompilerait pendant
 * que Bruno interroge le serveur, et laisserait un processus de plus a arreter.
 */
function startBackend(uri) {
  const shell = process.platform === 'win32';
  return spawn('pnpm', ['--filter', 'back', 'exec', 'nest', 'start'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: environmentFor(uri),
    shell,
    detached: !shell,
  });
}

function environmentFor(uri) {
  return { ...process.env, MONGODB_URI: uri, PORT: E2E_PORT };
}

/**
 * Un serveur etranger deja sur le port repondrait a la place du notre, contre sa
 * propre base, et la collection echouerait en accusant le code. On refuse alors
 * de demarrer, en nommant le coupable.
 */
async function assertPortIsFree() {
  if (!(await portAccepts())) return;
  throw new Error(
    `Le port ${E2E_PORT} est deja pris par ${portOccupant()}. ` +
      'Arreter ce processus avant de relancer l E2E.',
  );
}

function portOccupant() {
  const describe = OCCUPANT_LOOKUP[process.platform] ?? OCCUPANT_LOOKUP.default;
  return describe() ?? "un processus que ce script n'a pas su identifier";
}

function windowsOccupant() {
  const listening = capture('netstat', ['-ano', '-p', 'tcp'])
    .split('\n')
    .find((row) => new RegExp(`:${E2E_PORT}\\s`).test(row) && row.includes('LISTENING'));
  if (!listening) return null;

  const pid = listening.trim().split(/\s+/).pop();
  return `${windowsProcessName(pid)} (PID ${pid})`;
}

/**
 * Pas de `/fi` : son filtre contient des espaces, et le shell Windows le
 * couperait en trois arguments. On demande tout, on cherche la ligne du PID.
 */
function windowsProcessName(pid) {
  const row = capture('tasklist', ['/nh', '/fo', 'csv'])
    .split('\n')
    .find((line) => line.includes(`"${pid}"`));

  const [, name] = /^"([^"]+)"/.exec(row ?? '') ?? [];
  return name ?? 'un processus';
}

function unixOccupant() {
  const [, listening] = capture('lsof', [
    '-nP', `-iTCP:${E2E_PORT}`, '-sTCP:LISTEN',
  ]).split('\n');
  if (!listening) return null;

  const [name, pid] = listening.trim().split(/\s+/);
  return `${name} (PID ${pid})`;
}

/** Le port ouvert signe la fin du `app.listen()` de Nest : le serveur repond. */
async function waitUntilListening(backend) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    assertStillAlive(backend);
    if (await portAccepts()) return;
    await delay(PROBE_INTERVAL_MS);
  }
  throw new Error(`Le backend n'ecoute toujours pas sur le port ${E2E_PORT}.`);
}

/** Un backend mort n'ecoutera jamais : inutile de sonder trois minutes de plus. */
function assertStillAlive(backend) {
  if (backend.exitCode === null) return;
  throw new Error(`Le backend s'est arrete avant d'ecouter (code ${backend.exitCode}).`);
}

function portAccepts() {
  return new Promise((settle) => {
    const socket = connect({ host: '127.0.0.1', port: Number(E2E_PORT) })
      .on('connect', () => {
        socket.destroy();
        settle(true);
      })
      .on('error', () => settle(false));
  });
}

/**
 * `nest start` est lance par un shim `pnpm` : tuer ce seul identifiant laisserait
 * le node enfant tenir le port. D'ou l'arret de l'arborescence entiere.
 */
function stop(backend) {
  if (backend.exitCode !== null || backend.pid === undefined) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(backend.pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }
  process.kill(-backend.pid, 'SIGTERM');
}

function runCollection() {
  return exec('bru', ['run', '--env', 'Local', '--tests-only', '--bail'], join(ROOT, 'e2e/bruno'));
}

function dropDatabases() {
  exec(process.execPath, [join(ROOT, 'scripts/drop-e2e-databases.mjs')], ROOT);
}

/**
 * `bru` et `pnpm` sont des shims `.cmd` sous Windows : sans shell, ils ne se
 * lancent pas. Mais `process.execPath` est un chemin absolu qui contient souvent
 * un espace, et le shell le couperait au premier blanc. Les deux besoins
 * s'excluent : seul un nom de commande passe par le shell.
 */
function exec(command, args, cwd, env = process.env) {
  const shell = process.platform === 'win32' && !isAbsolute(command);
  return spawnSync(command, args, { cwd, stdio: 'inherit', shell, env }).status;
}

/** Meme arbitrage de shell qu'`exec`, mais la sortie revient au lieu de defiler. */
function capture(command, args) {
  const shell = process.platform === 'win32' && !isAbsolute(command);
  return spawnSync(command, args, { shell, encoding: 'utf8' }).stdout ?? '';
}
