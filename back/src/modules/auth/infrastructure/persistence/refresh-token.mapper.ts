import { RefreshToken } from '../../domain/token/refresh-token';
import type { RefreshTokenSnapshot } from '../../domain/token/refresh-token';

/**
 * Document Mongo : le snapshot, plus `expiresOn`.
 *
 * Un index TTL Mongo n'agit QUE sur un champ Date, et `expiresAt` est une chaîne
 * ISO (contrat partagé) : posé dessus, l'index serait silencieusement ignoré.
 * `expiresOn` est la projection Date du même instant, écrite ici et jamais relue.
 */
export type RefreshTokenDocument = RefreshTokenSnapshot & { expiresOn: Date };

export function toDomain(document: RefreshTokenDocument): RefreshToken {
  return RefreshToken.restore(document);
}

export function toPersistence(token: RefreshToken): RefreshTokenDocument {
  const snapshot = token.snapshot();
  return { ...snapshot, expiresOn: new Date(snapshot.expiresAt) };
}
