// Modes d'échec du domaine campaigns — purs, zéro I/O.
// Chacun déclare sa nature via la classe dont il hérite ; la traduction en statut
// HTTP est faite une seule fois par common/filters/domain-exception.filter.

import {
  ConflictDomainError,
  ForbiddenDomainError,
  InvalidDomainError,
  NotFoundDomainError,
} from '@kernel/domain/domain.error';

export class CampaignNotFoundError extends NotFoundDomainError {
  constructor() {
    super('Campaign not found');
  }
}

export class CampaignCommandConflictError extends ConflictDomainError {
  constructor() {
    super('This idempotency key is already bound to another command');
  }
}

export class CampaignRevisionConflictError extends ConflictDomainError {
  constructor() {
    super('The campaign was modified by another command');
  }
}

export class CampaignInvitationRevisionConflictError extends ConflictDomainError {
  constructor() {
    super('The campaign invitation was modified by another command');
  }
}

export class AlreadyOpenCampaignInvitationError extends ConflictDomainError {
  constructor() {
    super('This user already has an open invitation to this campaign');
  }
}

export class InviteeNotFoundError extends NotFoundDomainError {
  constructor() {
    super('No user found with this display name');
  }
}

export class NoPendingCampaignInvitationError extends NotFoundDomainError {
  constructor() {
    super('No pending invitation for this user in this campaign');
  }
}

/**
 * La CIBLE d'une action n'est pas dans la campagne. Distincte de
 * `NotCampaignMemberError`, qui parle de l'APPELANT : confondre les deux
 * répondrait « pas à toi » là où il fallait dire « pas trouvé », et l'inverse.
 */
export class MemberNotFoundError extends NotFoundDomainError {
  constructor() {
    super('This user is not a member of this campaign');
  }
}

export class CannotInviteSelfError extends InvalidDomainError {
  constructor() {
    super('Cannot invite yourself to a campaign');
  }
}

export class CannotTransferToSelfError extends InvalidDomainError {
  constructor() {
    super('You already own this campaign');
  }
}

/** Un maître du jeu qui veut se retirer quitte la campagne, ou la supprime. */
export class CannotRemoveSelfError extends InvalidDomainError {
  constructor() {
    super('Use leave to remove yourself from a campaign');
  }
}

/** Le propriétaire qui part passe la main : la campagne ne reste jamais sans. */
export class SuccessorRequiredError extends InvalidDomainError {
  constructor() {
    super('The owner must designate a successor before leaving');
  }
}

export class NotCampaignGameMasterError extends ForbiddenDomainError {
  constructor() {
    super('Only a game master can perform this action');
  }
}

export class NotCampaignMemberError extends ForbiddenDomainError {
  constructor() {
    super('User is not an active member of this campaign');
  }
}

/** Supprimer et transférer sont les deux droits du seul propriétaire. */
export class NotCampaignOwnerError extends ForbiddenDomainError {
  constructor() {
    super('Only the owner can perform this action');
  }
}

export class InviteeIsNotAFriendError extends ForbiddenDomainError {
  constructor() {
    super('Only a friend can be invited to a campaign');
  }
}

export class AlreadyCampaignMemberError extends ConflictDomainError {
  constructor() {
    super('This user is already a member of this campaign');
  }
}

/**
 * Une campagne sans maître de jeu n'aurait plus personne pour l'administrer.
 * L'unique maître de jeu promeut donc quelqu'un avant de partir — et s'il est
 * seul, il ne lui reste que la suppression.
 */
export class CannotLeaveAsLastGameMasterError extends ConflictDomainError {
  constructor() {
    super('The last game master cannot leave the campaign');
  }
}

export class AlreadyGameMasterError extends ConflictDomainError {
  constructor() {
    super('This member is already a game master');
  }
}

export class NotAGameMasterError extends ConflictDomainError {
  constructor() {
    super('This member is not a game master');
  }
}

/** Même invariant que le départ : il reste toujours un maître du jeu. */
export class CannotDemoteLastGameMasterError extends ConflictDomainError {
  constructor() {
    super('The last game master cannot be demoted');
  }
}

/**
 * Le propriétaire est intouchable par les autres maîtres du jeu. Sans cette
 * règle, deux d'entre eux l'éjecteraient de la campagne qu'il reste seul à
 * pouvoir supprimer.
 */
export class CannotDemoteOwnerError extends ConflictDomainError {
  constructor() {
    super('The owner cannot be demoted');
  }
}

export class CannotRemoveOwnerError extends ConflictDomainError {
  constructor() {
    super('The owner cannot be removed from the campaign');
  }
}

/** On rétrograde un maître du jeu avant de le retirer : deux gestes, deux décisions. */
export class CannotRemoveGameMasterError extends ConflictDomainError {
  constructor() {
    super('Demote this game master before removing them');
  }
}

/**
 * Le propriétaire peut redevenir joueur, mais pas au prix de laisser la
 * campagne sans aucun maître du jeu — même garde que pour un départ ou une
 * rétrogradation ordinaire.
 */
export class CannotSelfDemoteAsLastGameMasterError extends ConflictDomainError {
  constructor() {
    super('The owner cannot step down as the last game master');
  }
}
