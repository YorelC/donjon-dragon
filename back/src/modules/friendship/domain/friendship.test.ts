import { randomUUID } from 'crypto';
import { describe, it, expect } from 'vitest';
import { InvalidUserIdError, UserId } from '@kernel/domain/user-id';

import { Friendship } from './friendship';
import { FriendshipId, InvalidFriendshipIdError } from './friendship-id';
import {
  CannotFriendSelfError,
  FriendRequestNotPendingError,
  NotFriendshipParticipantError,
  NotRequestRecipientError,
} from './friendship.errors';

const alice = UserId.create(randomUUID());
const bob = UserId.create(randomUUID());
const carol = UserId.create(randomUUID());

describe('Friendship.request', () => {
  it('naît pending, du demandeur vers le destinataire', () => {
    const friendship = Friendship.request(alice, bob);

    expect(friendship.status).toBe('pending');
    expect(friendship.requesterId.equals(alice)).toBe(true);
    expect(friendship.recipientId.equals(bob)).toBe(true);
  });

  it('refuse une demande à soi-même', () => {
    expect(() => Friendship.request(alice, alice)).toThrow(CannotFriendSelfError);
  });
});

describe('Friendship.accept', () => {
  it('passe à accepted quand le destinataire accepte', () => {
    const friendship = Friendship.request(alice, bob);

    friendship.accept(bob);

    expect(friendship.status).toBe('accepted');
  });

  it('refuse que le demandeur accepte sa propre demande', () => {
    const friendship = Friendship.request(alice, bob);

    expect(() => friendship.accept(alice)).toThrow(NotRequestRecipientError);
  });

  it('refuse un tiers', () => {
    const friendship = Friendship.request(alice, bob);

    expect(() => friendship.accept(carol)).toThrow(NotRequestRecipientError);
  });

  it('refuse une seconde acceptation', () => {
    const friendship = Friendship.request(alice, bob);
    friendship.accept(bob);

    expect(() => friendship.accept(bob)).toThrow(FriendRequestNotPendingError);
  });
});

describe('Friendship.refuse', () => {
  it('passe à refused quand le destinataire refuse', () => {
    const friendship = Friendship.request(alice, bob);

    friendship.refuse(bob);

    expect(friendship.status).toBe('refused');
  });

  it('refuse une acceptation après un refus', () => {
    const friendship = Friendship.request(alice, bob);
    friendship.refuse(bob);

    expect(() => friendship.accept(bob)).toThrow(FriendRequestNotPendingError);
  });
});

describe('Friendship — participants', () => {
  it('reconnaît ses deux participants et personne d autre', () => {
    const friendship = Friendship.request(alice, bob);

    expect(friendship.involves(alice)).toBe(true);
    expect(friendship.involves(bob)).toBe(true);
    expect(friendship.involves(carol)).toBe(false);
  });

  it('donne l autre participant, dans les deux sens', () => {
    const friendship = Friendship.request(alice, bob);

    expect(friendship.friendIdFor(alice).equals(bob)).toBe(true);
    expect(friendship.friendIdFor(bob).equals(alice)).toBe(true);
  });

  it('refuse de désigner un ami pour un tiers', () => {
    const friendship = Friendship.request(alice, bob);

    expect(() => friendship.friendIdFor(carol)).toThrow(
      NotFriendshipParticipantError,
    );
    expect(() => friendship.assertInvolves(carol)).toThrow(
      NotFriendshipParticipantError,
    );
  });
});

describe('Friendship — snapshot et réhydratation', () => {
  it('fait un aller-retour sans perte', () => {
    const original = Friendship.request(alice, bob);
    original.accept(bob);

    const restored = Friendship.restore(original.snapshot());

    expect(restored.snapshot()).toEqual(original.snapshot());
  });

  it('aplatit les identifiants en chaînes', () => {
    const snapshot = Friendship.request(alice, bob).snapshot();

    expect(snapshot.requesterId).toBe(alice.value);
    expect(typeof snapshot.id).toBe('string');
  });
});

// Ces deux invariants n'etaient verifies nulle part : friendshipId partait
// directement du parametre d'URL vers une requete Mongo (INV-002 non arme).
describe('Identifiants typés', () => {
  it('refuse un friendshipId qui n est pas un UUID', () => {
    expect(() => FriendshipId.create('nonexistent')).toThrow(
      InvalidFriendshipIdError,
    );
  });

  it('refuse un userId qui n est pas un UUID', () => {
    expect(() => UserId.create('42')).toThrow(InvalidUserIdError);
  });
});
