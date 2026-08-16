import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MONSTER_REPOSITORY } from './application/ports/monster.repository.port';
import { FindMonsterByKeyUseCase } from './application/use-cases/find-monster-by-key.use-case';
import { ListBestiaryUseCase } from './application/use-cases/list-bestiary.use-case';
import { MONSTER_MODEL, MonsterSchema } from './infrastructure/persistence/monster.schema';
import { MongoMonsterRepository } from './infrastructure/persistence/mongo-monster.repository';
import { BestiaryController } from './presentation/bestiary.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: MONSTER_MODEL, schema: MonsterSchema }])],
  controllers: [BestiaryController],
  providers: [
    { provide: MONSTER_REPOSITORY, useClass: MongoMonsterRepository },
    ListBestiaryUseCase,
    FindMonsterByKeyUseCase,
  ],
  exports: [FindMonsterByKeyUseCase],
})
export class BestiaryModule {}
