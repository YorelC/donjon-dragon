import { describe, it, expect, beforeEach } from 'vitest';
import { aUser } from '@modules/user/testing/user.fixture';
import { toPublicUser } from '@modules/user/application/user.mapper';
import { InMemoryFriendDirectory } from '../../testing/in-memory-friend-directory';
import { SearchUsersUseCase } from './search-users.use-case';

describe('SearchUsersUseCase', () => {
  let useCase: SearchUsersUseCase;
  let directory: InMemoryFriendDirectory;
  let alice: ReturnType<typeof aUser>;
  let bob: ReturnType<typeof aUser>;
  let bruno: ReturnType<typeof aUser>;

  beforeEach(async () => {
    directory = new InMemoryFriendDirectory();
    useCase = new SearchUsersUseCase(directory);

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
    bruno = aUser({
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
      userId: alice.id.value,
      query: 'b',
    });

    expect(result).toHaveLength(2);
    expect(result.map((u) => u.displayName)).toContain('bob');
    expect(result.map((u) => u.displayName)).toContain('bruno');
  });

  it('exclut l utilisateur qui fait la recherche', async () => {
    const result = await useCase.execute({
      userId: alice.id.value,
      query: 'alice',
    });

    expect(result).toEqual([]);
  });

  it('retourne liste vide si aucun match', async () => {
    const result = await useCase.execute({
      userId: alice.id.value,
      query: 'xyz',
    });

    expect(result).toEqual([]);
  });

  it('exclut le password hash', async () => {
    const result = await useCase.execute({
      userId: alice.id.value,
      query: 'bob',
    });

    expect(result[0]).not.toHaveProperty('passwordHash');
  });
});
