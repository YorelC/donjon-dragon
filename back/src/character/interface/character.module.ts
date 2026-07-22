import { Module } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { Character } from '@donjon-dragon/shared/character-schema';

import type { CharacterRepositoryPort } from '../domain/character.repository.port';
import { MongoCharacterRepository } from '../infrastructure/mongo-character.repository';
import { CHARACTER_MODEL, CharacterSchema } from '../infrastructure/character.schema';
import { CreateCharacterUseCase } from '../application/create-character.use-case';
import { GetCharacterUseCase } from '../application/get-character.use-case';
import { CharacterController } from './character.controller';

export const CHARACTER_REPOSITORY = 'CHARACTER_REPOSITORY';

@Module({
  imports: [MongooseModule.forFeature([{ name: CHARACTER_MODEL, schema: CharacterSchema }])],
  controllers: [CharacterController],
  providers: [
    {
      provide: CHARACTER_REPOSITORY,
      useFactory: (model: Model<Character>) => new MongoCharacterRepository(model),
      inject: [getModelToken(CHARACTER_MODEL)],
    },
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
