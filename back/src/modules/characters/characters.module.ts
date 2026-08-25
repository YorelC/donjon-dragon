import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ClockModule } from '@kernel/infrastructure/clock.module';
import { CampaignsModule } from '@modules/campaigns/campaigns.module';
import { ItemsModule } from '@modules/items/items.module';
import { UserModule } from '@modules/user/user.module';
import { CHARACTER_DIRECTORY } from './application/ports/character-directory.port';
import { CHARACTER_REPOSITORY } from './application/ports/character.repository.port';
import { ITEM_CATALOG } from './application/ports/item-catalog.port';
import { AssignCharacterUseCase } from './application/use-cases/assign-character.use-case';
import { CreateCharacterUseCase } from './application/use-cases/create-character.use-case';
import { DeleteCharacterUseCase } from './application/use-cases/delete-character.use-case';
import { ExcludeCampaignMemberWithCharacterUseCase } from './application/use-cases/exclude-campaign-member-with-character.use-case';
import { FinalizeCharacterUseCase } from './application/use-cases/finalize-character.use-case';
import { GetCharacterBuildUseCase } from './application/use-cases/get-character-build.use-case';
import { GetCharacterSheetUseCase } from './application/use-cases/get-character-sheet.use-case';
import { GetClassSpellListUseCase } from './application/use-cases/get-class-spell-list.use-case';
import { GetDndCatalogUseCase } from './application/use-cases/get-dnd-catalog.use-case';
import { ListCampaignCharactersUseCase } from './application/use-cases/list-campaign-characters.use-case';
import { LeaveCampaignWithCharacterUseCase } from './application/use-cases/leave-campaign-with-character.use-case';
import { PromoteCampaignMemberWithCharacterUseCase } from './application/use-cases/promote-campaign-member-with-character.use-case';
import { PreviewCharacterSheetUseCase } from './application/use-cases/preview-character-sheet.use-case';
import { UnassignCharacterUseCase } from './application/use-cases/unassign-character.use-case';
import { ItemsItemCatalog } from './infrastructure/acl/items-item-catalog';
import { UserCharacterDirectory } from './infrastructure/acl/user-character-directory';
import {
  CHARACTER_MODEL,
  CharacterSchema,
} from './infrastructure/persistence/character.schema';
import { MongoCharacterRepository } from './infrastructure/persistence/mongo-character.repository';
import { CharacterController } from './presentation/character.controller';
import { CampaignCharacterLifecycleController } from './presentation/campaign-character-lifecycle.controller';
import { DndCatalogController } from './presentation/dnd-catalog.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CHARACTER_MODEL, schema: CharacterSchema }]),
    UserModule,
    CampaignsModule,
    ItemsModule,
    ClockModule,
  ],
  controllers: [
    CharacterController,
    CampaignCharacterLifecycleController,
    DndCatalogController,
  ],
  providers: [
    { provide: CHARACTER_REPOSITORY, useClass: MongoCharacterRepository },
    { provide: CHARACTER_DIRECTORY, useClass: UserCharacterDirectory },
    { provide: ITEM_CATALOG, useClass: ItemsItemCatalog },
    ListCampaignCharactersUseCase,
    CreateCharacterUseCase,
    FinalizeCharacterUseCase,
    PreviewCharacterSheetUseCase,
    GetCharacterSheetUseCase,
    GetCharacterBuildUseCase,
    GetDndCatalogUseCase,
    GetClassSpellListUseCase,
    DeleteCharacterUseCase,
    AssignCharacterUseCase,
    UnassignCharacterUseCase,
    PromoteCampaignMemberWithCharacterUseCase,
    ExcludeCampaignMemberWithCharacterUseCase,
    LeaveCampaignWithCharacterUseCase,
  ],
})
export class CharactersModule {}
