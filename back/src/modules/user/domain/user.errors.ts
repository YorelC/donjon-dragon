// Modes d'échec de l'agrégat User — purs, zéro I/O.
// Ces invariants (unicité de l'email, unicité du pseudo, existence) appartiennent
// à user : c'est ici qu'ils sont déclarés, quel que soit le module qui déclenche
// l'opération.

import {
  DOMAIN_ERROR_CODE,
  type DomainErrorCode,
} from '@donjon-dragon/shared/error-schema';

import {
  ConflictDomainError,
  NotFoundDomainError,
} from '@kernel/domain/domain.error';

// Ces deux conflits partagent le statut 409 mais ne désignent pas le même champ
// du formulaire d'inscription : ils portent un code pour que le front puisse
// pointer le bon, sans avoir à reconnaître une phrase anglaise.
export class EmailAlreadyInUseError extends ConflictDomainError {
  readonly code: DomainErrorCode = DOMAIN_ERROR_CODE['email-already-in-use'];

  constructor() {
    super('Email already in use');
  }
}

export class DisplayNameAlreadyTakenError extends ConflictDomainError {
  readonly code: DomainErrorCode = DOMAIN_ERROR_CODE['display-name-already-taken'];

  constructor() {
    super('Display name already taken');
  }
}

export class UserNotFoundError extends NotFoundDomainError {
  constructor() {
    super('User not found');
  }
}
