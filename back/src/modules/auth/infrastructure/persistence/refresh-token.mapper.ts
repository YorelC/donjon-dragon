import { RefreshToken } from '../../domain/token/refresh-token';
import type { RefreshTokenSnapshot } from '../../domain/token/refresh-token';

/**
 * Document Mongo. `expiresAt` y est une vraie `Date` là où le domaine manipule
 * une chaîne ISO : un index TTL Mongo n'agit QUE sur un champ Date, et posé sur
 * une chaîne il serait silencieusement ignoré — la collection grossirait sans
 * fin en donnant l'illusion d'être purgée.
 *
 * C'est exactement le travail d'un mapper : la forme stockée n'a pas à être
 * celle du domaine.
 */
export type RefreshTokenDocument = Omit<RefreshTokenSnapshot, 'expiresAt'> & {
  expiresAt: Date;
};

export function toDomain(document: RefreshTokenDocument): RefreshToken {
  return RefreshToken.restore({
    ...document,
    expiresAt: document.expiresAt.toISOString(),
  });
}

export function toPersistence(token: RefreshToken): RefreshTokenDocument {
  const snapshot = token.snapshot();
  return { ...snapshot, expiresAt: new Date(snapshot.expiresAt) };
}
