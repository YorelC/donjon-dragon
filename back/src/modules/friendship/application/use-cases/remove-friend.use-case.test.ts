import { randomUUID } from 'crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import { anActor } from '@kernel/testing/actor.fixture';
import { FixedClock } from '@kernel/testing/fixed-clock';
import { aUser } from '@modules/user/testing/user.fixture';
import {
  FriendshipNotFoundError,
  NotFriendshipParticipantError,
} from '../../domain/friendship.errors';
import { InvalidFriendshipIdError } from '../../domain/friendship-id';
import { InMemoryFriendshipRepository } from '../../testing/in-memory-friendship.repository';
import { RemoveFriendUseCase } from './remove-friend.use-case';
import { pendingRequest, accept } from '../../testing/friendship.fixture';

describe('RemoveFriendUseCase', () => {
  let useCase: RemoveFriendUseCase;
  let friendshipRepo: InMemoryFriendshipRepository;
  let alice: ReturnType<typeof aUser>;
  let bob: ReturnType<typeof aUser>;
  let charlie: ReturnType<typeof aUser>;

  beforeEach(async () => {
    friendshipRepo = new InMemoryFriendshipRepository();
    useCase = new RemoveFriendUseCase(friendshipRepo, new FixedClock());

    alice = aUser({
      email: 'alice@example.com',
      displayName: 'alice',
      passwordHash: 'hashedpw',
    });
    bob = aUser({
      email: 'bob@example.com',
      displayName: 'bob',
      passwordHash: 'hashedpw',
    });
    charlie = aUser({
      email: 'charlie@example.com',
      displayName: 'charlie',
      passwordHash: 'hashedpw',
    });
  });

  it('supprime une amitié accepted', async () => {
    const f = pendingRequest(alice.id.value, bob.id.value);
    const accepted = accept(f, bob.id.value);
    await friendshipRepo.save(accepted);

    await useCase.execute({
      userId: anActor(alice.id.value),
      friendshipId: f.id.value,
    });

    const found = await friendshipRepo.findById(f.id);
    expect(found).toBeNull();
  });

  it('lève FriendshipNotFoundError si id inexistent', async () => {
    await expect(
      useCase.execute({
        userId: anActor(alice.id.value),
        friendshipId: randomUUID(),
      }),
    ).rejects.toThrow(FriendshipNotFoundError);
  });

  // Distinct du cas precedent : un id mal forme est une entree invalide (400),
  // pas une ressource absente (404). Arme INV-002.
  it('lève InvalidFriendshipIdError si id mal formé', async () => {
    await expect(
      useCase.execute({
        userId: anActor(alice.id.value),
        friendshipId: 'pas-un-uuid',
      }),
    ).rejects.toThrow(InvalidFriendshipIdError);
  });

  it('lève NotFriendshipParticipantError si user not involved', async () => {
    const f = pendingRequest(alice.id.value, bob.id.value);
    const accepted = accept(f, bob.id.value);
    await friendshipRepo.save(accepted);

    await expect(
      useCase.execute({
        userId: anActor(charlie.id.value),
        friendshipId: f.id.value,
      }),
    ).rejects.toThrow(NotFriendshipParticipantError);
  });

  it('permet au recipient de supprimer une amitié accepted', async () => {
    const f = pendingRequest(alice.id.value, bob.id.value);
    const accepted = accept(f, bob.id.value);
    await friendshipRepo.save(accepted);

    await useCase.execute({
      userId: anActor(bob.id.value),
      friendshipId: f.id.value,
    });

    const found = await friendshipRepo.findById(f.id);
    expect(found).toBeNull();
  });
});
