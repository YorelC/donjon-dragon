// Modes d'échec de l'agrégat User — purs, zéro I/O.
// Ces invariants (unicité de l'email, unicité du pseudo, existence) appartiennent
// à user : c'est ici qu'ils sont déclarés, quel que soit le module qui déclenche
// l'opération.

import {
  ConflictDomainError,
  NotFoundDomainError,
} from '@kernel/domain/domain.error';

export class EmailAlreadyInUseError extends ConflictDomainError {
  constructor() {
    super('Email already in use');
  }
}

export class DisplayNameAlreadyTakenError extends ConflictDomainError {
  constructor() {
    super('Display name already taken');
  }
}

export class UserNotFoundError extends NotFoundDomainError {
  constructor() {
    super('User not found');
  }
}
