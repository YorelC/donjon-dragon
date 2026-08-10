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
      page: 1,
    });

    expect(result.items).toHaveLength(2);
    expect(result.items.map((u) => u.displayName)).toContain('bob');
    expect(result.items.map((u) => u.displayName)).toContain('bruno');
  });

  it('exclut l utilisateur qui fait la recherche', async () => {
    const result = await useCase.execute({
      userId: anActor(alice.id.value),
      query: 'alice',
      page: 1,
    });

    expect(result.items).toEqual([]);
  });

  it('retourne liste vide si aucun match', async () => {
    const result = await useCase.execute({
      userId: anActor(alice.id.value),
      query: 'xyz',
      page: 1,
    });

    expect(result.items).toEqual([]);
  });

  // Le resultat ne doit rien contenir d'autre que le pseudo : ni hash, ni email,
  // ni identifiant systeme. C'est ce qui part sur le reseau vers un tiers.
  it('ne divulgue que le pseudo', async () => {
    const result = await useCase.execute({
      userId: anActor(alice.id.value),
      query: 'bob',
      page: 1,
    });

    expect(Object.keys(result.items[0]!)).toEqual(['displayName']);
  });

  describe('pagination', () => {
    beforeEach(async () => {
      // 25 users matchant "argonaut" : de quoi couvrir une page pleine (hasMore
      // true) et une page partielle (hasMore false).
      for (let i = 1; i <= 25; i += 1) {
        const index = String(i).padStart(2, '0');
        const user = aUser({
          email: `argonaut-${index}@example.com`,
          displayName: `argonaut${index}`,
          passwordHash: 'hashedpw',
        });
        await directory.save(toUserIdentity(user));
      }
    });

    it('renvoie hasMore=true quand une page suivante existe', async () => {
      const result = await useCase.execute({
        userId: anActor(alice.id.value),
        query: 'argonaut',
        page: 1,
      });

      expect(result.items).toHaveLength(20);
      expect(result.hasMore).toBe(true);
    });

    it('renvoie le reste des resultats en page 2, avec hasMore=false', async () => {
      const result = await useCase.execute({
        userId: anActor(alice.id.value),
        query: 'argonaut',
        page: 2,
      });

      expect(result.items).toHaveLength(5);
      expect(result.hasMore).toBe(false);
    });

    it('renvoie un ordre stable (alphabetique) entre deux pages', async () => {
      const firstPage = await useCase.execute({
        userId: anActor(alice.id.value),
        query: 'argonaut',
        page: 1,
      });
      const secondPage = await useCase.execute({
        userId: anActor(alice.id.value),
        query: 'argonaut',
        page: 2,
      });

      expect(firstPage.items[0]?.displayName).toBe('argonaut01');
      expect(secondPage.items[0]?.displayName).toBe('argonaut21');
    });
  });
});
