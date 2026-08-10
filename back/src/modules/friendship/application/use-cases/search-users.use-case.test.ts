import { describe, it, expect, beforeEach } from 'vitest';
import { aUser } from '@modules/user/testing/user.fixture';
import { anActor } from '@kernel/testing/actor.fixture';
import { toUserIdentity } from '@modules/user/application/user.mapper';
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

    await directory.save(toUserIdentity(alice));
    await directory.save(toUserIdentity(bob));
    await directory.save(toUserIdentity(bruno));
  });

  it('recherche des users par displayName', async () => {
    const result = await useCase.execute({
      userId: anActor(alice.id.value),
      query: 'b',
    });

    expect(result).toHaveLength(2);
    expect(result.map((u) => u.displayName)).toContain('bob');
    expect(result.map((u) => u.displayName)).toContain('bruno');
  });

  it('exclut l utilisateur qui fait la recherche', async () => {
    const result = await useCase.execute({
      userId: anActor(alice.id.value),
      query: 'alice',
    });

    expect(result).toEqual([]);
  });

  it('retourne liste vide si aucun match', async () => {
    const result = await useCase.execute({
      userId: anActor(alice.id.value),
      query: 'xyz',
    });

    expect(result).toEqual([]);
  });

  // Le resultat ne doit rien contenir d'autre que le pseudo : ni hash, ni email,
  // ni identifiant systeme. C'est ce qui part sur le reseau vers un tiers.
  it('ne divulgue que le pseudo', async () => {
    const result = await useCase.execute({
      userId: anActor(alice.id.value),
      query: 'bob',
    });

    expect(Object.keys(result[0]!)).toEqual(['displayName']);
  });
});
