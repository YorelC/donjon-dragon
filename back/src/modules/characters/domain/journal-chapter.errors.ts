// Modes d'échec du journal de bord (spec 013) — purs, zéro I/O.

import {
  DOMAIN_ERROR_CODE,
  type DomainErrorCode,
} from '@donjon-dragon/shared/error-schema';

import {
  ConflictDomainError,
  ForbiddenDomainError,
  NotFoundDomainError,
} from '@kernel/domain/domain.error';

export class JournalChapterNotFoundError extends NotFoundDomainError {
  constructor() {
    super('Journal chapter not found');
  }
}

/** Le lecteur n'écrit pas : un MJ face au journal d'un personnage qui a son joueur. */
export class JournalNotWritableError extends ForbiddenDomainError {
  constructor() {
    super('You are not allowed to write in this journal');
  }
}

export class JournalFullError extends ConflictDomainError {
  constructor() {
    super('This journal cannot hold another chapter');
  }
}

// Le code ouvre, côté client, le choix entre la saisie locale et la version
// enregistrée : un autre 409 du journal ne doit pas l'ouvrir.
export class JournalChapterModifiedElsewhereError extends ConflictDomainError {
  readonly code: DomainErrorCode = DOMAIN_ERROR_CODE['journal-chapter-modified-elsewhere'];

  constructor() {
    super('The journal chapter was modified elsewhere');
  }
}

/** L'ordre reçu ne contient pas exactement les chapitres du journal. */
export class JournalOrderMismatchError extends ConflictDomainError {
  constructor() {
    super('The chapter order does not match the journal');
  }
}

export class JournalCommandConflictError extends ConflictDomainError {
  constructor() {
    super('The idempotency key was already used for another journal command');
  }
}
