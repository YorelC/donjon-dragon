import type {
  DirectoryUser,
  FriendDirectoryPort,
} from '../application/ports/friend-directory.port';

/** Double de test de l'annuaire : aucune dépendance au module user. */
export class InMemoryFriendDirectory implements FriendDirectoryPort {
  private readonly users = new Map<string, DirectoryUser>();

  async save(user: DirectoryUser): Promise<DirectoryUser> {
    this.users.set(user.id, user);
    return user;
  }

  async findById(id: string): Promise<DirectoryUser | null> {
    return this.users.get(id) ?? null;
  }

  async findByDisplayName(displayName: string): Promise<DirectoryUser | null> {
    return (
      [...this.users.values()].find((user) => user.displayName === displayName) ?? null
    );
  }

  async search(query: string, limit: number): Promise<DirectoryUser[]> {
    const needle = query.toLowerCase();
    return [...this.users.values()]
      .filter((user) => user.displayName.toLowerCase().includes(needle))
      .slice(0, limit);
  }
}
