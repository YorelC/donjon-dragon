import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ClockModule } from '@kernel/infrastructure/clock.module';
import { DiceModule } from '@kernel/infrastructure/dice.module';
import { CampaignsModule } from '@modules/campaigns/campaigns.module';
import { UserModule } from '@modules/user/user.module';
import { CHARACTER_DIRECTORY } from './application/ports/character-directory.port';
import { CHARACTER_REPOSITORY } from './application/ports/character.repository.port';
import { AssignCharacterUseCase } from './application/use-cases/assign-character.use-case';
import { DeleteCharacterUseCase } from './application/use-cases/delete-character.use-case';
import { FinalizeCharacterUseCase } from './application/use-cases/finalize-character.use-case';
import { GetCharacterSheetUseCase } from './application/use-cases/get-character-sheet.use-case';
import { GetClassSpellListUseCase } from './application/use-cases/get-class-spell-list.use-case';
import { GetDndCatalogUseCase } from './application/use-cases/get-dnd-catalog.use-case';
import { ListCampaignCharactersUseCase } from './application/use-cases/list-campaign-characters.use-case';
import { PreviewCharacterSheetUseCase } from './application/use-cases/preview-character-sheet.use-case';
import { RenameCharacterUseCase } from './application/use-cases/rename-character.use-case';
import { RollCharacterAbilitiesUseCase } from './application/use-cases/roll-character-abilities.use-case';
import { StartCharacterUseCase } from './application/use-cases/start-character.use-case';
import { UnassignCharacterUseCase } from './application/use-cases/unassign-character.use-case';
import { UserCharacterDirectory } from './infrastructure/acl/user-character-directory';
import {
  CHARACTER_MODEL,
  CharacterSchema,
} from './infrastructure/persistence/character.schema';
import { MongoCharacterRepository } from './infrastructure/persistence/mongo-character.repository';
import { CharacterController } from './presentation/character.controller';
import { DndCatalogController } from './presentation/dnd-catalog.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CHARACTER_MODEL, schema: CharacterSchema }]),
    UserModule,
    CampaignsModule,
    ClockModule,
    DiceModule,
  ],
  controllers: [CharacterController, DndCatalogController],
  providers: [
    { provide: CHARACTER_REPOSITORY, useClass: MongoCharacterRepository },
    { provide: CHARACTER_DIRECTORY, useClass: UserCharacterDirectory },
    ListCampaignCharactersUseCase,
    StartCharacterUseCase,
    RollCharacterAbilitiesUseCase,
    FinalizeCharacterUseCase,
    RenameCharacterUseCase,
    PreviewCharacterSheetUseCase,
    GetCharacterSheetUseCase,
    GetDndCatalogUseCase,
    GetClassSpellListUseCase,
    DeleteCharacterUseCase,
    AssignCharacterUseCase,
    UnassignCharacterUseCase,
  ],
})
export class CharactersModule {}
