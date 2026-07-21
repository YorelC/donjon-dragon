import { NotFoundException } from '@nestjs/common';
import type { Character } from '@donjon-dragon/shared/character-schema';

import type { CharacterRepositoryPort } from '../domain/character.repository.port';

export class GetCharactersByUserUseCase {
  constructor(private readonly repo: CharacterRepositoryPort) {}

  execute(userId: string): Promise<Character[]> {
    return this.repo.findAllByUserId(userId);
  }
}

export class DeleteCharacterUseCase {
  constructor(private readonly repo: CharacterRepositoryPort) {}

  async execute(id: string): Promise<void> {
    const character = await this.repo.findById(id);
    if (!character) {
      throw new NotFoundException(`Character ${id} not found`);
    }
    await this.repo.delete(id);
  }
}

export class GetCharacterUseCase {
  private readonly getByUser: GetCharactersByUserUseCase;
  private readonly deleteCharacter: DeleteCharacterUseCase;

  constructor(private readonly repo: CharacterRepositoryPort) {
    this.getByUser = new GetCharactersByUserUseCase(repo);
    this.deleteCharacter = new DeleteCharacterUseCase(repo);
  }

  async execute(id: string): Promise<Character> {
    const character = await this.repo.findById(id);
    if (!character) {
      throw new NotFoundException(`Character ${id} not found`);
    }
    return character;
  }

  findAllByUser(userId: string): Promise<Character[]> {
    return this.getByUser.execute(userId);
  }

  delete(id: string): Promise<void> {
    return this.deleteCharacter.execute(id);
  }
}
