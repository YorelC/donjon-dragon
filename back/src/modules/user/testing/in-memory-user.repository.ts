import type { UserId } from '@kernel/domain/user-id';

import type { UserRepositoryPort, UserSearchPage } from '../application/ports/user-repository.port';
import type { DisplayName } from '../domain/display-name';
import type { Email } from '../domain/email';
import type { User } from '../domain/user';

export class InMemoryUserRepository implements UserRepositoryPort {
  private readonly users = new Map<string, User>();

  async save(user: User): Promise<void> {
    this.users.set(user.id.value, user);
  }

  async findById(id: UserId): Promise<User | null> {
    return this.users.get(id.value) ?? null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    return this.all().find((user) => user.email.equals(email)) ?? null;
  }

  async findByDisplayName(displayName: DisplayName): Promise<User | null> {
    return this.all().find((user) => user.displayName.equals(displayName)) ?? null;
  }

  async searchByDisplayName(query: string, page: number, limit: number): Promise<UserSearchPage> {
    const needle = query.toLowerCase();
    // Même tri que l'implémentation Mongo (displayName asc) : le double doit
    // refléter l'ordre garanti par le port, pas seulement ses données.
    const matches = this.all()
      .filter((user) => user.displayName.value.toLowerCase().includes(needle))
      .sort((a, b) => a.displayName.value.localeCompare(b.displayName.value));

    const skip = (page - 1) * limit;
    const items = matches.slice(skip, skip + limit);
    return { items, hasMore: matches.length > skip + limit };
  }

  private all(): User[] {
    return [...this.users.values()];
  }
}
