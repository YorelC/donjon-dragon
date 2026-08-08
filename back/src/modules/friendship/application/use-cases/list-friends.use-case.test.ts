import { describe, it, expect, beforeEach } from 'vitest';
import { createUser } from '@modules/user/domain/user.entity';
import { toPublicUser } from '@modules/user/application/user.mapper';
import { InMemoryFriendDirectory } from '../../testing/in-memory-friend-directory';
import { InMemoryFriendshipRepository } from '../../testing/in-memory-friendship.repository';
import { ListFriendsUseCase } from './list-friends.use-case';
import { pendingRequest, accept } from '../../testing/friendship.fixture';

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
    const f1 = pendingRequest(alice.id, bob.id);
    const accepted1 = accept(f1, bob.id);
    await friendshipRepo.save(accepted1);

    const f2 = pendingRequest(alice.id, charlie.id);
    const accepted2 = accept(f2, charlie.id);
    await friendshipRepo.save(accepted2);

    const result = await useCase.execute({ userId: alice.id });

    expect(result).toHaveLength(2);
    expect(result.map((af) => af.friend.id)).toContain(bob.id);
    expect(result.map((af) => af.friend.id)).toContain(charlie.id);
    expect(result.every((af) => af.friendshipId)).toBe(true);
  });

  it('exclut les amités pending', async () => {
    const f1 = pendingRequest(alice.id, bob.id);
    await friendshipRepo.save(f1);

    const f2 = pendingRequest(charlie.id, alice.id);
    const accepted = accept(f2, alice.id);
    await friendshipRepo.save(accepted);

    const result = await useCase.execute({ userId: alice.id });

    expect(result).toHaveLength(1);
    expect(result[0]!.friend.id).toBe(charlie.id);
  });
});
