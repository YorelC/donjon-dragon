import { describe, it, expect, beforeEach } from 'vitest';
import { createUser } from '@modules/user/domain/user.entity';
import { toPublicUser } from '@modules/user/application/user.mapper';
import { InMemoryFriendDirectory } from '../../testing/in-memory-friend-directory';
import { SearchUsersUseCase } from './search-users.use-case';

describe('SearchUsersUseCase', () => {
  let useCase: SearchUsersUseCase;
  let directory: InMemoryFriendDirectory;
  let alice: ReturnType<typeof createUser>;
  let bob: ReturnType<typeof createUser>;
  let bruno: ReturnType<typeof createUser>;

  beforeEach(async () => {
    directory = new InMemoryFriendDirectory();
    useCase = new SearchUsersUseCase(directory);

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
    bruno = createUser({
      email: 'bruno@example.com',
      displayName: 'bruno',
      passwordHash: 'hashedpw',
    });

    await directory.save(toPublicUser(alice));
    await directory.save(toPublicUser(bob));
    await directory.save(toPublicUser(bruno));
  });

  it('recherche des users par displayName', async () => {
    const result = await useCase.execute({
      userId: alice.id,
      query: 'b',
    });

    expect(result).toHaveLength(2);
    expect(result.map((u) => u.displayName)).toContain('bob');
    expect(result.map((u) => u.displayName)).toContain('bruno');
  });

  it('exclut l utilisateur qui fait la recherche', async () => {
    const result = await useCase.execute({
      userId: alice.id,
      query: 'alice',
    });

    expect(result).toEqual([]);
  });

  it('retourne liste vide si aucun match', async () => {
    const result = await useCase.execute({
      userId: alice.id,
      query: 'xyz',
    });

    expect(result).toEqual([]);
  });

  it('exclut le password hash', async () => {
    const result = await useCase.execute({
      userId: alice.id,
      query: 'bob',
    });

    expect(result[0]).not.toHaveProperty('passwordHash');
  });
});
