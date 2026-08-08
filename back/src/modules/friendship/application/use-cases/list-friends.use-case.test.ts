import { describe, it, expect, beforeEach } from 'vitest';
import { aUser } from '@modules/user/testing/user.fixture';
import { toPublicUser } from '@modules/user/application/user.mapper';
import { InMemoryFriendDirectory } from '../../testing/in-memory-friend-directory';
import { InMemoryFriendshipRepository } from '../../testing/in-memory-friendship.repository';
import { ListFriendsUseCase } from './list-friends.use-case';
import { pendingRequest, accept } from '../../testing/friendship.fixture';

describe('ListFriendsUseCase', () => {
  let useCase: ListFriendsUseCase;
  let directory: InMemoryFriendDirectory;
  let friendshipRepo: InMemoryFriendshipRepository;
  let alice: ReturnType<typeof aUser>;
  let bob: ReturnType<typeof aUser>;
  let charlie: ReturnType<typeof aUser>;

  beforeEach(async () => {
    directory = new InMemoryFriendDirectory();
    friendshipRepo = new InMemoryFriendshipRepository();
    useCase = new ListFriendsUseCase(friendshipRepo, directory);

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

    await directory.save(toPublicUser(alice));
    await directory.save(toPublicUser(bob));
    await directory.save(toPublicUser(charlie));
  });

  it('retourne une liste vide si pas d amis', async () => {
    const result = await useCase.execute({ userId: alice.id.value });
    expect(result).toEqual([]);
  });

  it('retourne la liste des amis accepted', async () => {
    const f1 = pendingRequest(alice.id.value, bob.id.value);
    const accepted1 = accept(f1, bob.id.value);
    await friendshipRepo.save(accepted1);

    const f2 = pendingRequest(alice.id.value, charlie.id.value);
    const accepted2 = accept(f2, charlie.id.value);
    await friendshipRepo.save(accepted2);

    const result = await useCase.execute({ userId: alice.id.value });

    expect(result).toHaveLength(2);
    expect(result.map((af) => af.friend.id)).toContain(bob.id.value);
    expect(result.map((af) => af.friend.id)).toContain(charlie.id.value);
    expect(result.every((af) => af.friendshipId)).toBe(true);
  });

  it('exclut les amités pending', async () => {
    const f1 = pendingRequest(alice.id.value, bob.id.value);
    await friendshipRepo.save(f1);

    const f2 = pendingRequest(charlie.id.value, alice.id.value);
    const accepted = accept(f2, alice.id.value);
    await friendshipRepo.save(accepted);

    const result = await useCase.execute({ userId: alice.id.value });

    expect(result).toHaveLength(1);
    expect(result[0]!.friend.id).toBe(charlie.id.value);
  });
});
