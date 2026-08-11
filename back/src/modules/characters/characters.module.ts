import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ClockModule } from '@kernel/infrastructure/clock.module';
import { CampaignsModule } from '@modules/campaigns/campaigns.module';
import { UserModule } from '@modules/user/user.module';
import { CHARACTER_DIRECTORY } from './application/ports/character-directory.port';
import { CHARACTER_REPOSITORY } from './application/ports/character.repository.port';
import { AssignCharacterUseCase } from './application/use-cases/assign-character.use-case';
import { CreateCharacterUseCase } from './application/use-cases/create-character.use-case';
import { DeleteCharacterUseCase } from './application/use-cases/delete-character.use-case';
import { ListCampaignCharactersUseCase } from './application/use-cases/list-campaign-characters.use-case';
import { UnassignCharacterUseCase } from './application/use-cases/unassign-character.use-case';
import { UpdateCharacterUseCase } from './application/use-cases/update-character.use-case';
import { UserCharacterDirectory } from './infrastructure/acl/user-character-directory';
import {
  CHARACTER_MODEL,
  CharacterSchema,
} from './infrastructure/persistence/character.schema';
import { MongoCharacterRepository } from './infrastructure/persistence/mongo-character.repository';
import { CharacterController } from './presentation/character.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CHARACTER_MODEL, schema: CharacterSchema }]),
    UserModule,
    CampaignsModule,
    ClockModule,
  ],
  controllers: [CharacterController],
  providers: [
    { provide: CHARACTER_REPOSITORY, useClass: MongoCharacterRepository },
    { provide: CHARACTER_DIRECTORY, useClass: UserCharacterDirectory },
    ListCampaignCharactersUseCase,
    CreateCharacterUseCase,
    UpdateCharacterUseCase,
    DeleteCharacterUseCase,
    AssignCharacterUseCase,
    UnassignCharacterUseCase,
  ],
})
export class CharactersModule {}
