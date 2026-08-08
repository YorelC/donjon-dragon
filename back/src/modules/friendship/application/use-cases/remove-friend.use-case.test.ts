import { describe, it, expect, beforeEach } from 'vitest';
import { createUser } from '@modules/user/domain/user.entity';
import {
  FriendshipNotFoundError,
  NotFriendshipParticipantError,
} from '../../domain/friendship.errors';
import { InMemoryFriendshipRepository } from '../../testing/in-memory-friendship.repository';
import { RemoveFriendUseCase } from './remove-friend.use-case';
import { createFriendRequest, acceptFriendRequest } from '../../domain/friendship.entity';

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
    const f = createFriendRequest(alice.id, bob.id);
    const accepted = acceptFriendRequest(f, bob.id);
    await friendshipRepo.save(accepted);

    await useCase.execute({
      userId: alice.id,
      friendshipId: f.id,
    });

    const found = await friendshipRepo.findById(f.id);
    expect(found).toBeNull();
  });

  it('lève FriendshipNotFoundError si id inexistent', async () => {
    await expect(
      useCase.execute({
        userId: alice.id,
        friendshipId: 'nonexistent',
      }),
    ).rejects.toThrow(FriendshipNotFoundError);
  });

  it('lève NotFriendshipParticipantError si user not involved', async () => {
    const f = createFriendRequest(alice.id, bob.id);
    const accepted = acceptFriendRequest(f, bob.id);
    await friendshipRepo.save(accepted);

    await expect(
      useCase.execute({
        userId: charlie.id,
        friendshipId: f.id,
      }),
    ).rejects.toThrow(NotFriendshipParticipantError);
  });

  it('permet au recipient de supprimer une amitié accepted', async () => {
    const f = createFriendRequest(alice.id, bob.id);
    const accepted = acceptFriendRequest(f, bob.id);
    await friendshipRepo.save(accepted);

    await useCase.execute({
      userId: bob.id,
      friendshipId: f.id,
    });

    const found = await friendshipRepo.findById(f.id);
    expect(found).toBeNull();
  });
});
