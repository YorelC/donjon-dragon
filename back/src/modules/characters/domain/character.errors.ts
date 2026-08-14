// Modes d'échec du domaine characters — purs, zéro I/O.

import {
  ConflictDomainError,
  ForbiddenDomainError,
  NotFoundDomainError,
} from '@kernel/domain/domain.error';

export class CharacterNotFoundError extends NotFoundDomainError {
  constructor() {
    super('Character not found');
  }
}

export class NotActiveCampaignMemberError extends ForbiddenDomainError {
  constructor() {
    super('User is not an active member of this campaign');
  }
}

export class AssigneeNotFoundError extends NotFoundDomainError {
  constructor() {
    super('No user found with this display name');
  }
}

/** Un joueur n'a jamais plus d'un personnage assigné à la fois dans une campagne. */
export class PlayerAlreadyHasCharacterError extends ConflictDomainError {
  constructor() {
    super('This player already has a character in this campaign');
  }
}

/**
 * Refus d'édition/suppression : l'appelant n'est ni le créateur, ni le joueur
 * assigné, ni un maître du jeu habilité (attribué, ou propriétaire face à un
 * personnage d'un autre MJ).
 */
export class NotEditableByActorError extends ForbiddenDomainError {
  constructor() {
    super('You are not allowed to edit this character');
  }
}

export class OnlyGameMasterCanAssignError extends ForbiddenDomainError {
  constructor() {
    super('Only a game master can assign a character');
  }
}

export class AlreadyAssignedToThisPlayerError extends ConflictDomainError {
  constructor() {
    super('This character is already assigned to this player');
  }
}

export class NotAssignedError extends ConflictDomainError {
  constructor() {
    super('This character is not assigned to anyone');
  }
}

/** Le wizard rend sa copie avant d'avoir lancé les dés. */
export class AbilitiesNotRolledError extends ConflictDomainError {
  constructor() {
    super('Abilities have not been rolled yet');
  }
}

/**
 * Relancer les dés d'un personnage terminé reviendrait à retirer jusqu'à obtenir
 * six 18 tout en gardant sa fiche.
 */
export class CharacterAlreadyReadyError extends ConflictDomainError {
  constructor() {
    super('This character is already finalized');
  }
}

/** Un brouillon n'a pas de fiche : il manque encore les choix du joueur. */
export class CharacterNotReadyError extends ConflictDomainError {
  constructor() {
    super('This character is still a draft');
  }
}
