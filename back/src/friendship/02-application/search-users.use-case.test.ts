import { describe, it, expect, beforeEach } from 'vitest';
import { createUser } from '../../user/03-domain/user.entity';
import { InMemoryUserRepository } from '../../user/04-infrastructure/in-memory-user.repository';
import { SearchUsersUseCase } from './search-users.use-case';

describe('SearchUsersUseCase', () => {
  let useCase: SearchUsersUseCase;
  let userRepo: InMemoryUserRepository;
  let alice: ReturnType<typeof createUser>;
  let bob: ReturnType<typeof createUser>;
  let bruno: ReturnType<typeof createUser>;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    useCase = new SearchUsersUseCase(userRepo);

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

    await userRepo.save(alice);
    await userRepo.save(bob);
    await userRepo.save(bruno);
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
