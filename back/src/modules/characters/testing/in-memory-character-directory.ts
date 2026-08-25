import type {
  CharacterDirectoryPort,
  CharacterDirectoryUser,
} from '../application/ports/character-directory.port';

export class InMemoryCharacterDirectory implements CharacterDirectoryPort {
  private readonly users: CharacterDirectoryUser[] = [];
  displayNameLookupCount = 0;

  register(user: CharacterDirectoryUser): void {
    this.users.push(user);
  }

  async findById(id: string): Promise<CharacterDirectoryUser | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async findByDisplayName(displayName: string): Promise<CharacterDirectoryUser | null> {
    this.displayNameLookupCount += 1;
    return this.users.find((user) => user.displayName === displayName) ?? null;
  }

  resetLookupCount(): void {
    this.displayNameLookupCount = 0;
  }
}
