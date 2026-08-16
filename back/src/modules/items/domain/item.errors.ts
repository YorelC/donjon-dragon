// Modes d'échec du domaine items — purs, zéro I/O.

import { InvalidDomainError, NotFoundDomainError } from '@kernel/domain/domain.error';

export class InvalidItemNameError extends InvalidDomainError {
  constructor() {
    super('Invalid item name');
  }
}

export class InvalidItemCostError extends InvalidDomainError {
  constructor() {
    super('Item cost must be a non-negative integer of copper pieces');
  }
}

export class InvalidItemWeightError extends InvalidDomainError {
  constructor() {
    super('Item weight cannot be negative');
  }
}

export class InvalidItemQuantityError extends InvalidDomainError {
  constructor() {
    super('Item quantity must be a positive integer');
  }
}

/**
 * Un objet du manuel n'appartient à personne, un objet inventé appartient à la
 * campagne qui l'a inventé. Les deux autres combinaisons n'ont pas de sens : un
 * objet `srd` rattaché à une campagne serait invisible ailleurs sans raison, un
 * objet `campaign` sans campagne serait visible partout.
 */
export class InvalidItemScopeError extends InvalidDomainError {
  constructor() {
    super('Item scope and source disagree');
  }
}

/** Une arme sans dégâts, une corde qui en inflige : le type et les stats mentent. */
export class MismatchedItemStatsError extends InvalidDomainError {
  constructor() {
    super('Item stats do not match its type');
  }
}

export class ItemNotFoundError extends NotFoundDomainError {
  constructor() {
    super('Item not found');
  }
}
