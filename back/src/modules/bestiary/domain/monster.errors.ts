// Modes d'échec du domaine bestiary — purs, zéro I/O.

import { InvalidDomainError, NotFoundDomainError } from '@kernel/domain/domain.error';

export class InvalidMonsterNameError extends InvalidDomainError {
  constructor() {
    super('Invalid monster name');
  }
}

/** Une classe d'armure négative rendrait toute attaque touchante d'office. */
export class InvalidArmorClassError extends InvalidDomainError {
  constructor() {
    super('Monster armor class cannot be negative');
  }
}

/** Un profil à 0 point de vie serait mort avant d'entrer en jeu. */
export class InvalidHitPointsError extends InvalidDomainError {
  constructor() {
    super('Monster hit points must be a positive integer');
  }
}

/**
 * Un profil du manuel n'appartient à personne, un profil inventé appartient à la
 * campagne qui l'a inventé. Les deux autres combinaisons n'ont pas de sens : un
 * profil `srd` rattaché à une campagne serait invisible ailleurs sans raison, un
 * profil `campaign` sans campagne serait visible partout.
 */
export class InvalidMonsterScopeError extends InvalidDomainError {
  constructor() {
    super('Monster scope and origin disagree');
  }
}

export class MonsterNotFoundError extends NotFoundDomainError {
  constructor() {
    super('Monster not found');
  }
}
