import { describe, it, expect, beforeEach } from 'vitest';
import { createUser } from '@modules/user/domain/user.entity';
import { toPublicUser } from '@modules/user/application/user.mapper';
import { InMemoryFriendDirectory } from '../../testing/in-memory-friend-directory';
import { InMemoryFriendshipRepository } from '../../testing/in-memory-friendship.repository';
import { ListPendingReceivedUseCase } from './list-pending-received.use-case';
import { pendingRequest } from '../../testing/friendship.fixture';

describe('ListPendingReceivedUseCase', () => {
  let useCase: ListPendingReceivedUseCase;
  let directory: InMemoryFriendDirectory;
  let friendshipRepo: InMemoryFriendshipRepository;
  let alice: ReturnType<typeof createUser>;
  let bob: ReturnType<typeof createUser>;
  let charlie: ReturnType<typeof createUser>;

  beforeEach(async () => {
    directory = new InMemoryFriendDirectory();
    friendshipRepo = new InMemoryFriendshipRepository();
    useCase = new ListPendingReceivedUseCase(friendshipRepo, directory);

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

  it('retourne les demandes pending reçues', async () => {
    const f1 = pendingRequest(bob.id, alice.id);
    await friendshipRepo.save(f1);

    const f2 = pendingRequest(charlie.id, alice.id);
    await friendshipRepo.save(f2);

    const result = await useCase.execute({ userId: alice.id });

    expect(result).toHaveLength(2);
    expect(result[0]!.requester.id).toBe(bob.id);
    expect(result[1]!.requester.id).toBe(charlie.id);
  });

  it('exclut les demandes sent (recipientId != userId)', async () => {
    const f1 = pendingRequest(alice.id, bob.id);
    await friendshipRepo.save(f1);

    const f2 = pendingRequest(charlie.id, alice.id);
    await friendshipRepo.save(f2);

    const result = await useCase.execute({ userId: alice.id });

    expect(result).toHaveLength(1);
    expect(result[0]!.requester.id).toBe(charlie.id);
  });

  it('retourne liste vide si pas de demandes', async () => {
    const result = await useCase.execute({ userId: alice.id });
    expect(result).toEqual([]);
  });
});
