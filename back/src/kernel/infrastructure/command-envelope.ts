/**
 * Ce que partagent les dépôts de commande : un reçu d'idempotence, une entrée
 * d'audit et, selon la commande, les documents écrits dans la même transaction.
 * Déclaré une fois ici plutôt que recopié dans chaque dépôt. Les dépôts du module
 * characters s'y branchent ; ceux de campaigns en gardent encore leurs copies.
 */

/** Version des documents qu'une commande écrit : reçu, audit, version de build. */
export const ENVELOPE_SCHEMA_VERSION = 1;

export const ACCEPTED_STATUS = 'accepted';

const DUPLICATE_KEY_ERROR = 11000;

/**
 * Deux envois simultanés de la même clé : l'index unique des reçus en arrête un.
 * C'est alors le reçu déjà écrit qui fait foi, jamais une erreur Mongo brute.
 */
export function isDuplicateKey(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'code' in error && error.code === DUPLICATE_KEY_ERROR;
}
