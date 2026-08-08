import { describe, it, expect, beforeEach } from 'vitest';
import { createUser } from '@modules/user/domain/user.entity';
import { InMemoryUserRepository } from '@modules/user/infrastructure/persistence/in-memory-user.repository';
import { InMemoryFriendshipRepository } from '../../infrastructure/persistence/in-memory-friendship.repository';
import { ListPendingSentUseCase } from './list-pending-sent.use-case';
import { createFriendRequest } from '../../domain/friendship.entity';

describe('ListPendingSentUseCase', () => {
  let useCase: ListPendingSentUseCase;
  let userRepo: InMemoryUserRepository;
  let friendshipRepo: InMemoryFriendshipRepository;
  let alice: ReturnType<typeof createUser>;
  let bob: ReturnType<typeof createUser>;
  let charlie: ReturnType<typeof createUser>;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    friendshipRepo = new InMemoryFriendshipRepository();
    useCase = new ListPendingSentUseCase(friendshipRepo, userRepo);

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

    await userRepo.save(alice);
    await userRepo.save(bob);
    await userRepo.save(charlie);
  });

  it('retourne les demandes pending envoyées', async () => {
    const f1 = createFriendRequest(alice.id, bob.id);
    await friendshipRepo.save(f1);

    const f2 = createFriendRequest(alice.id, charlie.id);
    await friendshipRepo.save(f2);

    const result = await useCase.execute({ userId: alice.id });

    expect(result).toHaveLength(2);
    expect(result[0]!.recipient.id).toBe(bob.id);
    expect(result[1]!.recipient.id).toBe(charlie.id);
  });

  it('exclut les demandes received (requesterId != userId)', async () => {
    const f1 = createFriendRequest(alice.id, bob.id);
    await friendshipRepo.save(f1);

    const f2 = createFriendRequest(charlie.id, alice.id);
    await friendshipRepo.save(f2);

    const result = await useCase.execute({ userId: alice.id });

    expect(result).toHaveLength(1);
    expect(result[0]?.recipient.id).toBe(bob.id);
  });

  it('retourne liste vide si pas de demandes envoyées', async () => {
    const result = await useCase.execute({ userId: alice.id });
    expect(result).toEqual([]);
  });
});
