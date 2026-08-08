/**
 * Socle des modes d'échec métier, partagé par tous les modules.
 *
 * Une erreur de domaine déclare sa NATURE (`kind`), jamais un code HTTP : le
 * domaine ignore qu'HTTP existe. La traduction en statut est faite une seule
 * fois, par common/filters/domain-exception.filter.ts — ce qui permet à
 * `common/` de rester sans aucune connaissance du métier.
 */
export type DomainErrorKind =
  | 'invalid'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'conflict';

export abstract class DomainError extends Error {
  abstract readonly kind: DomainErrorKind;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Entrée refusée par une règle métier (et non par le schéma). */
export abstract class InvalidDomainError extends DomainError {
  readonly kind: DomainErrorKind = 'invalid';
}

/** Identité non établie ou preuve invalide. */
export abstract class UnauthorizedDomainError extends DomainError {
  readonly kind: DomainErrorKind = 'unauthorized';
}

/** Identité établie, mais l'action ne lui appartient pas. */
export abstract class ForbiddenDomainError extends DomainError {
  readonly kind: DomainErrorKind = 'forbidden';
}

export abstract class NotFoundDomainError extends DomainError {
  readonly kind: DomainErrorKind = 'not-found';
}

/** Conflit avec l'état courant (doublon, transition impossible). */
export abstract class ConflictDomainError extends DomainError {
  readonly kind: DomainErrorKind = 'conflict';
}
