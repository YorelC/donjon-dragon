import { randomUUID } from 'crypto';
import { describe, it, expect } from 'vitest';
import { InvalidUserIdError, UserId } from '@kernel/domain/user-id';
import { TEST_INSTANT } from '@kernel/testing/fixed-clock';

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

/** L'agregat ne lit plus l'horloge : on la lui fournit. */
const NOW = TEST_INSTANT;
const LATER = new Date(NOW.getTime() + 60_000);

describe('Friendship.request', () => {
  it('naît pending, du demandeur vers le destinataire', () => {
    const friendship = Friendship.request(alice, bob, NOW);

    expect(friendship.status).toBe('pending');
    expect(friendship.requesterId.equals(alice)).toBe(true);
    expect(friendship.recipientId.equals(bob)).toBe(true);
  });

  it('refuse une demande à soi-même', () => {
    expect(() => Friendship.request(alice, alice, NOW)).toThrow(CannotFriendSelfError);
  });

  it('naît créée et modifiée au même instant, celui qu on lui donne', () => {
    const snapshot = Friendship.request(alice, bob, NOW).snapshot();

    expect(snapshot.createdAt).toBe(NOW.toISOString());
    expect(snapshot.updatedAt).toBe(NOW.toISOString());
  });
});

describe('Friendship.accept', () => {
  it('passe à accepted quand le destinataire accepte', () => {
    const friendship = Friendship.request(alice, bob, NOW);

    friendship.accept(bob, NOW);

    expect(friendship.status).toBe('accepted');
  });

  it('refuse que le demandeur accepte sa propre demande', () => {
    const friendship = Friendship.request(alice, bob, NOW);

    expect(() => friendship.accept(alice, NOW)).toThrow(NotRequestRecipientError);
  });

  it('refuse un tiers', () => {
    const friendship = Friendship.request(alice, bob, NOW);

    expect(() => friendship.accept(carol, NOW)).toThrow(NotRequestRecipientError);
  });

  it('refuse une seconde acceptation', () => {
    const friendship = Friendship.request(alice, bob, NOW);
    friendship.accept(bob, NOW);

    expect(() => friendship.accept(bob, NOW)).toThrow(FriendRequestNotPendingError);
  });

  // Verifiable exactement, la ou il fallait avant comparer a un `new Date()` interne.
  it('avance updatedAt à l instant de la transition, sans toucher createdAt', () => {
    const friendship = Friendship.request(alice, bob, NOW);

    friendship.accept(bob, LATER);

    expect(friendship.snapshot().createdAt).toBe(NOW.toISOString());
    expect(friendship.snapshot().updatedAt).toBe(LATER.toISOString());
  });

  it('ne touche pas updatedAt quand la transition est refusée', () => {
    const friendship = Friendship.request(alice, bob, NOW);

    expect(() => friendship.accept(carol, LATER)).toThrow();

    // L'invariant garde l'agregat intact : une tentative rejetee ne laisse aucune
    // trace, pas meme une date.
    expect(friendship.snapshot().updatedAt).toBe(NOW.toISOString());
  });
});

describe('Friendship.refuse', () => {
  it('passe à refused quand le destinataire refuse', () => {
    const friendship = Friendship.request(alice, bob, NOW);

    friendship.refuse(bob, NOW);

    expect(friendship.status).toBe('refused');
  });

  it('refuse une acceptation après un refus', () => {
    const friendship = Friendship.request(alice, bob, NOW);
    friendship.refuse(bob, NOW);

    expect(() => friendship.accept(bob, NOW)).toThrow(FriendRequestNotPendingError);
  });

  it('avance updatedAt à l instant du refus', () => {
    const friendship = Friendship.request(alice, bob, NOW);

    friendship.refuse(bob, LATER);

    expect(friendship.snapshot().updatedAt).toBe(LATER.toISOString());
  });
});

describe('Friendship — participants', () => {
  it('reconnaît ses deux participants et personne d autre', () => {
    const friendship = Friendship.request(alice, bob, NOW);

    expect(friendship.involves(alice)).toBe(true);
    expect(friendship.involves(bob)).toBe(true);
    expect(friendship.involves(carol)).toBe(false);
  });

  it('donne l autre participant, dans les deux sens', () => {
    const friendship = Friendship.request(alice, bob, NOW);

    expect(friendship.friendIdFor(alice).equals(bob)).toBe(true);
    expect(friendship.friendIdFor(bob).equals(alice)).toBe(true);
  });

  it('refuse de désigner un ami pour un tiers', () => {
    const friendship = Friendship.request(alice, bob, NOW);

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
    const original = Friendship.request(alice, bob, NOW);
    original.accept(bob, LATER);

    const restored = Friendship.restore(original.snapshot());

    expect(restored.snapshot()).toEqual(original.snapshot());
  });

  it('aplatit les identifiants en chaînes', () => {
    const snapshot = Friendship.request(alice, bob, NOW).snapshot();

    expect(snapshot.requesterId).toBe(alice.value);
    expect(typeof snapshot.id).toBe('string');
  });

  // Le corollaire de l'horloge injectee : deux executions identiques produisent des
  // snapshots identiques, aux identifiants aleatoires pres.
  it('est reproductible à instant égal', () => {
    const first = Friendship.request(alice, bob, NOW).snapshot();
    const second = Friendship.request(alice, bob, NOW).snapshot();

    expect({ ...first, id: '' }).toEqual({ ...second, id: '' });
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
