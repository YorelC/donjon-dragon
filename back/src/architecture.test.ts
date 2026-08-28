import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * Tests de conformité de l'architecture, sur le TEXTE des sources.
 *
 * dependency-cruiser raisonne sur le graphe d'imports et couvre les frontières
 * entre couches. Il ne voit pas ce qui se passe à l'intérieur d'un fichier : un
 * `as` qui efface un type nominal lui est invisible. C'est ce trou-là que ce
 * fichier ferme, dans le même esprit que le bloc « protection des routes » des
 * controllers, qui assert une ABSENCE plutôt qu'une présence.
 */

const SRC = join(__dirname);

/**
 * Les seuls fichiers autorisés à forger un `ActorId`.
 *
 * `actor-id.ts` le définit. `jwt.strategy.ts` est le point où une identité
 * devient prouvée. `jwt-access-token-verifier.ts` applique la même frontière au
 * handshake temps réel. `actor.fixture.ts` est le double de test correspondant.
 * Tout `.test.ts` est hors production.
 *
 * Ajouter une entrée ici est une décision de sécurité : elle doit apparaître dans
 * une revue, pas se glisser dans un diff.
 */
const MINTING_IS_ALLOWED_IN = [
  join('kernel', 'domain', 'actor-id.ts'),
  join('kernel', 'testing', 'actor.fixture.ts'),
  join('modules', 'auth', 'presentation', 'strategies', 'jwt.strategy.ts'),
  join(
    'modules',
    'auth',
    'infrastructure',
    'token',
    'jwt-access-token-verifier.ts',
  ),
];

describe('ActorId ne se forge qu\'à partir d\'un token vérifié', () => {
  it('aucun `as ActorId` hors de la liste blanche', () => {
    expect(offendersMatching(/\bas\s+ActorId\b/)).toEqual([]);
  });

  it('aucun appel à actorFromVerifiedToken hors de la liste blanche', () => {
    expect(offendersMatching(/\bactorFromVerifiedToken\s*\(/)).toEqual([]);
  });
});

/** Les fichiers de production qui violent le motif, en chemins relatifs à src/. */
function offendersMatching(pattern: RegExp): string[] {
  return sourceFiles()
    .filter((file) => !isAllowed(file))
    .filter((file) => pattern.test(readFileSync(join(SRC, file), 'utf8')));
}

// Les chemins comparés utilisent le séparateur de la plateforme des deux côtés :
// relative() le produit, join() le produit aussi. Le test reste donc vrai sous
// Windows comme sous Linux, où tourne la CI.
function isAllowed(relativePath: string): boolean {
  if (relativePath.endsWith('.test.ts')) return true;

  return MINTING_IS_ALLOWED_IN.includes(relativePath);
}

function sourceFiles(directory: string = SRC): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(absolute);

    return entry.name.endsWith('.ts') ? [relative(SRC, absolute)] : [];
  });
}
