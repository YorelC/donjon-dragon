import { randomUUID } from 'crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import { aUser } from '@modules/user/testing/user.fixture';
import {
  FriendshipNotFoundError,
  FriendRequestNotPendingError,
  NotRequestRecipientError,
} from '../../domain/friendship.errors';
import { InvalidFriendshipIdError } from '../../domain/friendship-id';
import { InMemoryFriendshipRepository } from '../../testing/in-memory-friendship.repository';
import { RefuseFriendRequestUseCase } from './refuse-friend-request.use-case';
import { pendingRequest, refuse } from '../../testing/friendship.fixture';

describe('RefuseFriendRequestUseCase', () => {
  let useCase: RefuseFriendRequestUseCase;
  let friendshipRepo: InMemoryFriendshipRepository;
  let alice: ReturnType<typeof aUser>;
  let bob: ReturnType<typeof aUser>;

  beforeEach(async () => {
    friendshipRepo = new InMemoryFriendshipRepository();
    useCase = new RefuseFriendRequestUseCase(friendshipRepo);

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
  });

  it('refuse une demande pending', async () => {
    const friendship = pendingRequest(alice.id.value, bob.id.value);
    await friendshipRepo.save(friendship);

    const result = await useCase.execute({
      friendshipId: friendship.id.value,
      actingUserId: bob.id.value,
    });

    expect(result.status).toBe('refused');
  });

  it('lève FriendshipNotFoundError si id inexistent', async () => {
    await expect(
      useCase.execute({
        friendshipId: randomUUID(),
        actingUserId: bob.id.value,
      }),
    ).rejects.toThrow(FriendshipNotFoundError);
  });

  // Distinct du cas precedent : un id mal forme est une entree invalide (400),
  // pas une ressource absente (404). Arme INV-002.
  it('lève InvalidFriendshipIdError si id mal formé', async () => {
    await expect(
      useCase.execute({
        friendshipId: 'pas-un-uuid',
        actingUserId: bob.id.value,
      }),
    ).rejects.toThrow(InvalidFriendshipIdError);
  });

  it('lève FriendRequestNotPendingError si status != pending', async () => {
    const friendship = refuse(pendingRequest(alice.id.value, bob.id.value), bob.id.value);
    await friendshipRepo.save(friendship);

    await expect(
      useCase.execute({
        friendshipId: friendship.id.value,
        actingUserId: bob.id.value,
      }),
    ).rejects.toThrow(FriendRequestNotPendingError);
  });

  it('lève NotRequestRecipientError si user != recipient', async () => {
    const friendship = pendingRequest(alice.id.value, bob.id.value);
    await friendshipRepo.save(friendship);

    await expect(
      useCase.execute({
        friendshipId: friendship.id.value,
        actingUserId: alice.id.value,
      }),
    ).rejects.toThrow(NotRequestRecipientError);
  });
});
