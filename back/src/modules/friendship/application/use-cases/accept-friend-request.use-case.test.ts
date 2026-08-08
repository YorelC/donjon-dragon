import { randomUUID } from 'crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import { createUser } from '@modules/user/domain/user.entity';
import {
  FriendshipNotFoundError,
  FriendRequestNotPendingError,
  NotRequestRecipientError,
} from '../../domain/friendship.errors';
import { InvalidFriendshipIdError } from '../../domain/friendship-id';
import { InMemoryFriendshipRepository } from '../../testing/in-memory-friendship.repository';
import { AcceptFriendRequestUseCase } from './accept-friend-request.use-case';
import { pendingRequest, accept } from '../../testing/friendship.fixture';

describe('AcceptFriendRequestUseCase', () => {
  let useCase: AcceptFriendRequestUseCase;
  let friendshipRepo: InMemoryFriendshipRepository;
  let alice: ReturnType<typeof createUser>;
  let bob: ReturnType<typeof createUser>;

  beforeEach(async () => {
    friendshipRepo = new InMemoryFriendshipRepository();
    useCase = new AcceptFriendRequestUseCase(friendshipRepo);

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
  });

  it('accepte une demande pending', async () => {
    const friendship = pendingRequest(alice.id, bob.id);
    await friendshipRepo.save(friendship);

    const result = await useCase.execute({
      friendshipId: friendship.id.value,
      actingUserId: bob.id,
    });

    expect(result.status).toBe('accepted');
  });

  it('lève FriendshipNotFoundError si id inexistent', async () => {
    await expect(
      useCase.execute({
        friendshipId: randomUUID(),
        actingUserId: bob.id,
      }),
    ).rejects.toThrow(FriendshipNotFoundError);
  });

  // Distinct du cas precedent : un id mal forme est une entree invalide (400),
  // pas une ressource absente (404). Arme INV-002.
  it('lève InvalidFriendshipIdError si id mal formé', async () => {
    await expect(
      useCase.execute({
        friendshipId: 'pas-un-uuid',
        actingUserId: bob.id,
      }),
    ).rejects.toThrow(InvalidFriendshipIdError);
  });

  it('lève FriendRequestNotPendingError si status != pending', async () => {
    const friendship = accept(pendingRequest(alice.id, bob.id), bob.id);
    await friendshipRepo.save(friendship);

    await expect(
      useCase.execute({
        friendshipId: friendship.id.value,
        actingUserId: bob.id,
      }),
    ).rejects.toThrow(FriendRequestNotPendingError);
  });

  it('lève NotRequestRecipientError si user != recipient', async () => {
    const friendship = pendingRequest(alice.id, bob.id);
    await friendshipRepo.save(friendship);

    await expect(
      useCase.execute({
        friendshipId: friendship.id.value,
        actingUserId: alice.id,
      }),
    ).rejects.toThrow(NotRequestRecipientError);
  });
});
