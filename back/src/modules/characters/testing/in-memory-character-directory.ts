import type {
  CharacterDirectoryPort,
  CharacterDirectoryUser,
} from '../application/ports/character-directory.port';

export class InMemoryCharacterDirectory implements CharacterDirectoryPort {
  private readonly users: CharacterDirectoryUser[] = [];
  displayNameLookupCount = 0;
  batchLookupCount = 0;

  register(user: CharacterDirectoryUser): void {
    this.users.push(user);
  }

  async findById(id: string): Promise<CharacterDirectoryUser | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async findManyByIds(ids: string[]): Promise<CharacterDirectoryUser[]> {
    this.batchLookupCount += 1;
    return this.users.filter((user) => ids.includes(user.id));
  }

  async findByDisplayName(displayName: string): Promise<CharacterDirectoryUser | null> {
    this.displayNameLookupCount += 1;
    return this.users.find((user) => user.displayName === displayName) ?? null;
  }

  resetLookupCount(): void {
    this.displayNameLookupCount = 0;
    this.batchLookupCount = 0;
  }
}
