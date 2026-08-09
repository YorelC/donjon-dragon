import { describe, it, expect, beforeEach } from 'vitest';
import { aUser } from '@modules/user/testing/user.fixture';
import { toUserIdentity } from '@modules/user/application/user.mapper';
import { InMemoryFriendDirectory } from '../../testing/in-memory-friend-directory';
import { InMemoryFriendshipRepository } from '../../testing/in-memory-friendship.repository';
import { ListPendingSentUseCase } from './list-pending-sent.use-case';
import { pendingRequest } from '../../testing/friendship.fixture';

describe('ListPendingSentUseCase', () => {
  let useCase: ListPendingSentUseCase;
  let directory: InMemoryFriendDirectory;
  let friendshipRepo: InMemoryFriendshipRepository;
  let alice: ReturnType<typeof aUser>;
  let bob: ReturnType<typeof aUser>;
  let charlie: ReturnType<typeof aUser>;

  beforeEach(async () => {
    directory = new InMemoryFriendDirectory();
    friendshipRepo = new InMemoryFriendshipRepository();
    useCase = new ListPendingSentUseCase(friendshipRepo, directory);

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

    await directory.save(toUserIdentity(alice));
    await directory.save(toUserIdentity(bob));
    await directory.save(toUserIdentity(charlie));
  });

  it('retourne les demandes pending envoyées', async () => {
    const f1 = pendingRequest(alice.id.value, bob.id.value);
    await friendshipRepo.save(f1);

    const f2 = pendingRequest(alice.id.value, charlie.id.value);
    await friendshipRepo.save(f2);

    const result = await useCase.execute({ userId: alice.id.value });

    expect(result).toHaveLength(2);
    expect(result[0]!.recipient.displayName).toBe('bob');
    expect(result[1]!.recipient.displayName).toBe('charlie');
  });

  it('ne divulgue ni email ni identifiant d utilisateur', async () => {
    await friendshipRepo.save(pendingRequest(alice.id.value, bob.id.value));

    const result = await useCase.execute({ userId: alice.id.value });

    expect(Object.keys(result[0]!.recipient)).toEqual(['displayName']);
    expect(result[0]).not.toHaveProperty('requesterId');
    expect(result[0]).not.toHaveProperty('recipientId');
  });

  it('exclut les demandes received (requesterId != userId)', async () => {
    const f1 = pendingRequest(alice.id.value, bob.id.value);
    await friendshipRepo.save(f1);

    const f2 = pendingRequest(charlie.id.value, alice.id.value);
    await friendshipRepo.save(f2);

    const result = await useCase.execute({ userId: alice.id.value });

    expect(result).toHaveLength(1);
    expect(result[0]?.recipient.displayName).toBe('bob');
  });

  it('retourne liste vide si pas de demandes envoyées', async () => {
    const result = await useCase.execute({ userId: alice.id.value });
    expect(result).toEqual([]);
  });
});
