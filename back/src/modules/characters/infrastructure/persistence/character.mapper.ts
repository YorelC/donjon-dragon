import { Character, type CharacterSnapshot } from '../../domain/character';

export type CharacterDocument = CharacterSnapshot;

export function toDomain(document: CharacterDocument): Character {
  return Character.restore(document);
}

export function toPersistence(character: Character): CharacterDocument {
  return character.snapshot();
}
