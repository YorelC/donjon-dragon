import type { Character } from '@donjon-dragon/shared/character-schema';

import type { CharacterRepositoryPort } from '../domain/character.repository.port';

export class InMemoryCharacterRepository implements CharacterRepositoryPort {
  private readonly characters = new Map<string, Character>();

  async save(character: Character): Promise<Character> {
    this.characters.set(character.id, character);
    return character;
  }

  async findById(id: string): Promise<Character | null> {
    return this.characters.get(id) ?? null;
  }

  async findAllByUserId(userId: string): Promise<Character[]> {
    return [...this.characters.values()].filter((character) => character.userId === userId);
  }

  async delete(id: string): Promise<void> {
    this.characters.delete(id);
  }
}
