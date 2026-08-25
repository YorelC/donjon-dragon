import type {
  CampaignDirectoryPort,
  DirectoryUser,
} from '../application/ports/campaign-directory.port';

export class InMemoryCampaignDirectory implements CampaignDirectoryPort {
  private readonly users = new Map<string, DirectoryUser>();
  displayNameLookups = 0;

  /** Commodité de test absente du port : le vrai annuaire est en lecture seule. */
  save(user: DirectoryUser): void {
    this.users.set(user.id, user);
  }

  async findById(id: string): Promise<DirectoryUser | null> {
    return this.users.get(id) ?? null;
  }

  async findByDisplayName(displayName: string): Promise<DirectoryUser | null> {
    this.displayNameLookups += 1;
    return (
      [...this.users.values()].find((user) => user.displayName === displayName) ?? null
    );
  }

  async findManyByIds(ids: string[]): Promise<DirectoryUser[]> {
    return ids
      .map((id) => this.users.get(id))
      .filter((user): user is DirectoryUser => user !== undefined);
  }
}
