// Modes d'échec du domaine friendship — purs, zéro I/O.
// Chacun déclare sa nature via la classe dont il hérite ; la traduction en
// statut HTTP est faite une seule fois par common/filters/domain-exception.filter.

import {
  ConflictDomainError,
  ForbiddenDomainError,
  InvalidDomainError,
  NotFoundDomainError,
} from '@kernel/domain/domain.error';

export class CannotFriendSelfError extends InvalidDomainError {
  constructor() {
    super('Cannot send a friend request to yourself');
  }
}

export class RecipientNotFoundError extends NotFoundDomainError {
  constructor() {
    super('No user found with this display name');
  }
}

export class FriendshipNotFoundError extends NotFoundDomainError {
  constructor() {
    super('Friendship not found');
  }
}

export class FriendRequestAlreadyExistsError extends ConflictDomainError {
  constructor() {
    super('A pending friend request already exists between these users');
  }
}

export class AlreadyFriendsError extends ConflictDomainError {
  constructor() {
    super('These users are already friends');
  }
}

export class FriendRequestNotPendingError extends ConflictDomainError {
  constructor() {
    super('Friend request is not pending');
  }
}

export class NotRequestRecipientError extends ForbiddenDomainError {
  constructor() {
    super('Only the recipient can respond to this friend request');
  }
}

export class NotFriendshipParticipantError extends ForbiddenDomainError {
  constructor() {
    super('User is not a participant of this friendship');
  }
}
