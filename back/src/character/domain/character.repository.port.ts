import type { Character } from '@donjon-dragon/shared/character-schema';

export interface CharacterRepositoryPort {
  save(character: Character): Promise<Character>;
  findById(id: string): Promise<Character | null>;
  findAllByUserId(userId: string): Promise<Character[]>;
  delete(id: string): Promise<void>;
}
