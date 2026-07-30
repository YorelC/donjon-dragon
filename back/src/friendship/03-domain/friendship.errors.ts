// Modes d'échec du domaine friendship — purs, zéro I/O.
// Mappés en codes HTTP par 01-interface (voir DESIGN.md pour la table).

export class CannotFriendSelfError extends Error {
  constructor() {
    super('Cannot send a friend request to yourself');
    this.name = 'CannotFriendSelfError';
  }
}

export class RecipientNotFoundError extends Error {
  constructor() {
    super('No user found with this display name');
    this.name = 'RecipientNotFoundError';
  }
}

export class FriendRequestAlreadyExistsError extends Error {
  constructor() {
    super('A pending friend request already exists between these users');
    this.name = 'FriendRequestAlreadyExistsError';
  }
}

export class AlreadyFriendsError extends Error {
  constructor() {
    super('These users are already friends');
    this.name = 'AlreadyFriendsError';
  }
}

export class FriendshipNotFoundError extends Error {
  constructor() {
    super('Friendship not found');
    this.name = 'FriendshipNotFoundError';
  }
}

export class FriendRequestNotPendingError extends Error {
  constructor() {
    super('Friend request is not pending');
    this.name = 'FriendRequestNotPendingError';
  }
}

export class NotRequestRecipientError extends Error {
  constructor() {
    super('Only the recipient can respond to this friend request');
    this.name = 'NotRequestRecipientError';
  }
}

export class NotFriendshipParticipantError extends Error {
  constructor() {
    super('User is not a participant of this friendship');
    this.name = 'NotFriendshipParticipantError';
  }
}
