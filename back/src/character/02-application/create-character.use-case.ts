import type { Character, CreateCharacterDto } from '@donjon-dragon/shared/character-schema';

import type { CharacterRepositoryPort } from '../03-domain/character.repository.port';
import { createCharacter } from '../03-domain/character.entity';

export class CreateCharacterUseCase {
  constructor(private readonly repo: CharacterRepositoryPort) {}

  async execute(dto: CreateCharacterDto, userId: string): Promise<Character> {
    const entity = createCharacter({ ...dto, userId });

    const character: Character = {
      ...entity,
      race: dto.race,
      class: dto.class,
      hitPoints: entity.hitPoints.max,
    };

    return this.repo.save(character);
  }
}
