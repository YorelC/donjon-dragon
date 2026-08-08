import type { PublicUser } from '@donjon-dragon/shared/user-schema';

import type { FriendDirectoryPort } from '../../application/ports/friend-directory.port';

/** Double de test de l'annuaire : aucune dépendance au module user. */
export class InMemoryFriendDirectory implements FriendDirectoryPort {
  private readonly users = new Map<string, PublicUser>();

  async save(user: PublicUser): Promise<PublicUser> {
    this.users.set(user.id, user);
    return user;
  }

  async findById(id: string): Promise<PublicUser | null> {
    return this.users.get(id) ?? null;
  }

  async findByDisplayName(displayName: string): Promise<PublicUser | null> {
    return (
      [...this.users.values()].find((user) => user.displayName === displayName) ?? null
    );
  }

  async search(query: string, limit: number): Promise<PublicUser[]> {
    const needle = query.toLowerCase();
    return [...this.users.values()]
      .filter((user) => user.displayName.toLowerCase().includes(needle))
      .slice(0, limit);
  }
}
