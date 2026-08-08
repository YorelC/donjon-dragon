import type { User } from '@donjon-dragon/shared/user-schema';

import type { UserRepositoryPort } from '../../application/ports/user-repository.port';

export class InMemoryUserRepository implements UserRepositoryPort {
  private readonly users = new Map<string, User>();

  async save(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return [...this.users.values()].find((user) => user.email === email) ?? null;
  }

  async findByDisplayName(displayName: string): Promise<User | null> {
    return (
      [...this.users.values()].find((user) => user.displayName === displayName) ?? null
    );
  }

  async searchByDisplayName(query: string, limit: number): Promise<User[]> {
    const needle = query.toLowerCase();
    return [...this.users.values()]
      .filter((user) => user.displayName.toLowerCase().includes(needle))
      .slice(0, limit);
  }
}
