import { describe, it, expect, beforeEach } from 'vitest';
import { createUser } from '../../user/03-domain/user.entity';
import {
  FriendshipNotFoundError,
  FriendRequestNotPendingError,
  NotRequestRecipientError,
} from '../03-domain/friendship.errors';
import { InMemoryFriendshipRepository } from '../04-infrastructure/in-memory-friendship.repository';
import { AcceptFriendRequestUseCase } from './accept-friend-request.use-case';
import { createFriendRequest } from '../03-domain/friendship.entity';

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
    const friendship = createFriendRequest(alice.id, bob.id);
    await friendshipRepo.save(friendship);

    const result = await useCase.execute({
      friendshipId: friendship.id,
      actingUserId: bob.id,
    });

    expect(result.status).toBe('accepted');
  });

  it('lève FriendshipNotFoundError si id inexistent', async () => {
    await expect(
      useCase.execute({
        friendshipId: 'nonexistent',
        actingUserId: bob.id,
      }),
    ).rejects.toThrow(FriendshipNotFoundError);
  });

  it('lève FriendRequestNotPendingError si status != pending', async () => {
    const friendship = createFriendRequest(alice.id, bob.id);
    const accepted = { ...friendship, status: 'accepted' as const };
    await friendshipRepo.save(accepted);

    await expect(
      useCase.execute({
        friendshipId: friendship.id,
        actingUserId: bob.id,
      }),
    ).rejects.toThrow(FriendRequestNotPendingError);
  });

  it('lève NotRequestRecipientError si user != recipient', async () => {
    const friendship = createFriendRequest(alice.id, bob.id);
    await friendshipRepo.save(friendship);

    await expect(
      useCase.execute({
        friendshipId: friendship.id,
        actingUserId: alice.id,
      }),
    ).rejects.toThrow(NotRequestRecipientError);
  });
});
