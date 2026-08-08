import { describe, it, expect, beforeEach } from 'vitest';
import { createUser, toPublicUser } from '@modules/user/domain/user.entity';
import { InMemoryFriendDirectory } from '../../infrastructure/acl/in-memory-friend-directory';
import { InMemoryFriendshipRepository } from '../../infrastructure/persistence/in-memory-friendship.repository';
import { ListFriendsUseCase } from './list-friends.use-case';
import { createFriendRequest, acceptFriendRequest } from '../../domain/friendship.entity';

describe('ListFriendsUseCase', () => {
  let useCase: ListFriendsUseCase;
  let directory: InMemoryFriendDirectory;
  let friendshipRepo: InMemoryFriendshipRepository;
  let alice: ReturnType<typeof createUser>;
  let bob: ReturnType<typeof createUser>;
  let charlie: ReturnType<typeof createUser>;

  beforeEach(async () => {
    directory = new InMemoryFriendDirectory();
    friendshipRepo = new InMemoryFriendshipRepository();
    useCase = new ListFriendsUseCase(friendshipRepo, directory);

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

    await directory.save(toPublicUser(alice));
    await directory.save(toPublicUser(bob));
    await directory.save(toPublicUser(charlie));
  });

  it('retourne une liste vide si pas d amis', async () => {
    const result = await useCase.execute({ userId: alice.id });
    expect(result).toEqual([]);
  });

  it('retourne la liste des amis accepted', async () => {
    const f1 = createFriendRequest(alice.id, bob.id);
    const accepted1 = acceptFriendRequest(f1, bob.id);
    await friendshipRepo.save(accepted1);

    const f2 = createFriendRequest(alice.id, charlie.id);
    const accepted2 = acceptFriendRequest(f2, charlie.id);
    await friendshipRepo.save(accepted2);

    const result = await useCase.execute({ userId: alice.id });

    expect(result).toHaveLength(2);
    expect(result.map((af) => af.friend.id)).toContain(bob.id);
    expect(result.map((af) => af.friend.id)).toContain(charlie.id);
    expect(result.every((af) => af.friendshipId)).toBe(true);
  });

  it('exclut les amités pending', async () => {
    const f1 = createFriendRequest(alice.id, bob.id);
    await friendshipRepo.save(f1);

    const f2 = createFriendRequest(charlie.id, alice.id);
    const accepted = acceptFriendRequest(f2, alice.id);
    await friendshipRepo.save(accepted);

    const result = await useCase.execute({ userId: alice.id });

    expect(result).toHaveLength(1);
    expect(result[0]!.friend.id).toBe(charlie.id);
  });
});
