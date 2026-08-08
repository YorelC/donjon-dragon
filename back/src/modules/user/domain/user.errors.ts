// Modes d'échec du domaine user — purs, zéro I/O.

import { ConflictDomainError } from '@kernel/domain/domain.error';

export class DisplayNameAlreadyTakenError extends ConflictDomainError {
  constructor() {
    super('Display name already taken');
  }
}
