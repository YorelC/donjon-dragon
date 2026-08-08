import { randomUUID } from 'crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import { createUser } from '@modules/user/domain/user.entity';
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
  let alice: ReturnType<typeof createUser>;
  let bob: ReturnType<typeof createUser>;
  let charlie: ReturnType<typeof createUser>;

  beforeEach(async () => {
    friendshipRepo = new InMemoryFriendshipRepository();
    useCase = new RemoveFriendUseCase(friendshipRepo);

    alice = createUser({
      email: 'alice@example.com',
      displayName: 'alice',
      passwordHash: 'hashedpw',
    });
    bob = createUser({
      email: 'bob@example.com',
      displayName: 'bob',
      passwordHash: 'hashedpw',
    });
    charlie = createUser({
      email: 'charlie@example.com',
      displayName: 'charlie',
      passwordHash: 'hashedpw',
    });
  });

  it('supprime une amitié accepted', async () => {
    const f = pendingRequest(alice.id, bob.id);
    const accepted = accept(f, bob.id);
    await friendshipRepo.save(accepted);

    await useCase.execute({
      userId: alice.id,
      friendshipId: f.id.value,
    });

    const found = await friendshipRepo.findById(f.id);
    expect(found).toBeNull();
  });

  it('lève FriendshipNotFoundError si id inexistent', async () => {
    await expect(
      useCase.execute({
        userId: alice.id,
        friendshipId: randomUUID(),
      }),
    ).rejects.toThrow(FriendshipNotFoundError);
  });

  // Distinct du cas precedent : un id mal forme est une entree invalide (400),
  // pas une ressource absente (404). Arme INV-002.
  it('lève InvalidFriendshipIdError si id mal formé', async () => {
    await expect(
      useCase.execute({
        userId: alice.id,
        friendshipId: 'pas-un-uuid',
      }),
    ).rejects.toThrow(InvalidFriendshipIdError);
  });

  it('lève NotFriendshipParticipantError si user not involved', async () => {
    const f = pendingRequest(alice.id, bob.id);
    const accepted = accept(f, bob.id);
    await friendshipRepo.save(accepted);

    await expect(
      useCase.execute({
        userId: charlie.id,
        friendshipId: f.id.value,
      }),
    ).rejects.toThrow(NotFriendshipParticipantError);
  });

  it('permet au recipient de supprimer une amitié accepted', async () => {
    const f = pendingRequest(alice.id, bob.id);
    const accepted = accept(f, bob.id);
    await friendshipRepo.save(accepted);

    await useCase.execute({
      userId: bob.id,
      friendshipId: f.id.value,
    });

    const found = await friendshipRepo.findById(f.id);
    expect(found).toBeNull();
  });
});
