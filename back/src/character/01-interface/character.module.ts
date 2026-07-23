import { Module } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { Character } from '@donjon-dragon/shared/character-schema';

import type { CharacterRepositoryPort } from '../03-domain/character.repository.port';
import { MongoCharacterRepository } from '../04-infrastructure/mongo-character.repository';
import { CHARACTER_MODEL, CharacterSchema } from '../04-infrastructure/character.schema';
import { CreateCharacterUseCase } from '../02-application/create-character.use-case';
import { GetCharacterUseCase } from '../02-application/get-character.use-case';
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
