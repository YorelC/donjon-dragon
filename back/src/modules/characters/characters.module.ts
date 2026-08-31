import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ClockModule } from '@kernel/infrastructure/clock.module';
import {
  COMMAND_RECEIPT_MODEL,
  CommandReceiptSchema,
} from '@kernel/infrastructure/command-receipt.schema';
import {
  FUNCTIONAL_AUDIT_ENTRY_MODEL,
  FunctionalAuditEntrySchema,
} from '@kernel/infrastructure/functional-audit-entry.schema';
import {
  OUTBOX_MESSAGE_MODEL,
  OutboxMessageSchema,
} from '@kernel/infrastructure/outbox-message.schema';
import { CampaignsModule } from '@modules/campaigns/campaigns.module';
import { DiceModule } from '@kernel/infrastructure/dice.module';
import { ItemsModule } from '@modules/items/items.module';
import { UserModule } from '@modules/user/user.module';
import { CHARACTER_DIRECTORY } from './application/ports/character-directory.port';
import { ABILITY_ROLL_REPOSITORY } from './application/ports/ability-roll.repository.port';
import { CHARACTER_ASSIGNMENT_REPOSITORY } from './application/ports/character-assignment.repository.port';
import { CHARACTER_CREATION_REPOSITORY } from './application/ports/character-creation.repository.port';
import { CHARACTER_REPOSITORY } from './application/ports/character.repository.port';
import { ITEM_CATALOG } from './application/ports/item-catalog.port';
import { AssignCharacterUseCase } from './application/use-cases/assign-character.use-case';
import { CreateCharacterUseCase } from './application/use-cases/create-character.use-case';
import { RollAbilitiesUseCase } from './application/use-cases/roll-abilities.use-case';
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
import { MongoCharacterAssignmentRepository } from './infrastructure/persistence/mongo-character-assignment.repository';
import { MongoAbilityRollRepository } from './infrastructure/persistence/mongo-ability-roll.repository';
import { MongoCharacterCreationRepository } from './infrastructure/persistence/mongo-character-creation.repository';
import { CharacterController } from './presentation/character.controller';
import { CampaignCharacterLifecycleController } from './presentation/campaign-character-lifecycle.controller';
import { DndCatalogController } from './presentation/dnd-catalog.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CHARACTER_MODEL, schema: CharacterSchema },
      { name: COMMAND_RECEIPT_MODEL, schema: CommandReceiptSchema },
      { name: FUNCTIONAL_AUDIT_ENTRY_MODEL, schema: FunctionalAuditEntrySchema },
      { name: OUTBOX_MESSAGE_MODEL, schema: OutboxMessageSchema },
    ]),
    UserModule,
    CampaignsModule,
    ItemsModule,
    ClockModule,
    DiceModule,
  ],
  controllers: [
    CharacterController,
    CampaignCharacterLifecycleController,
    DndCatalogController,
  ],
  providers: [
    { provide: CHARACTER_REPOSITORY, useClass: MongoCharacterRepository },
    {
      provide: CHARACTER_ASSIGNMENT_REPOSITORY,
      useClass: MongoCharacterAssignmentRepository,
    },
    {
      provide: CHARACTER_CREATION_REPOSITORY,
      useClass: MongoCharacterCreationRepository,
    },
    { provide: ABILITY_ROLL_REPOSITORY, useClass: MongoAbilityRollRepository },
    { provide: CHARACTER_DIRECTORY, useClass: UserCharacterDirectory },
    { provide: ITEM_CATALOG, useClass: ItemsItemCatalog },
    ListCampaignCharactersUseCase,
    CreateCharacterUseCase,
    RollAbilitiesUseCase,
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
