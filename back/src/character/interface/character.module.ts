import { Module } from '@nestjs/common';

import type { CharacterRepositoryPort } from '../domain/character.repository.port';
import { InMemoryCharacterRepository } from '../infrastructure/in-memory-character.repository';
import { CreateCharacterUseCase } from '../application/create-character.use-case';
import { GetCharacterUseCase } from '../application/get-character.use-case';
import { CharacterController } from './character.controller';

export const CHARACTER_REPOSITORY = 'CHARACTER_REPOSITORY';

@Module({
  controllers: [CharacterController],
  providers: [
    { provide: CHARACTER_REPOSITORY, useClass: InMemoryCharacterRepository },
    {
      provide: CreateCharacterUseCase,
      useFactory: (repo: CharacterRepositoryPort) => new CreateCharacterUseCase(repo),
      inject: [CHARACTER_REPOSITORY],
    },
    {
      provide: GetCharacterUseCase,
      useFactory: (repo: CharacterRepositoryPort) => new GetCharacterUseCase(repo),
      inject: [CHARACTER_REPOSITORY],
    },
  ],
})
export class CharacterModule {}
