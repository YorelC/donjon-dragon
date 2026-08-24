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
import { FriendshipModule } from '@modules/friendship/friendship.module';
import { UserModule } from '@modules/user/user.module';
import { CAMPAIGN_DIRECTORY } from './application/ports/campaign-directory.port';
import { CAMPAIGN_REPOSITORY } from './application/ports/campaign.repository.port';
import { FRIENDSHIP_CHECKER } from './application/ports/friendship-checker.port';
import { AcceptCampaignInvitationUseCase } from './application/use-cases/accept-campaign-invitation.use-case';
import { CountCampaignInvitationsUseCase } from './application/use-cases/count-campaign-invitations.use-case';
import { CreateCampaignUseCase } from './application/use-cases/create-campaign.use-case';
import { DeleteCampaignUseCase } from './application/use-cases/delete-campaign.use-case';
import { DemoteCampaignMemberUseCase } from './application/use-cases/demote-campaign-member.use-case';
import { GetCampaignDetailUseCase } from './application/use-cases/get-campaign-detail.use-case';
import { GetCampaignMembershipUseCase } from './application/use-cases/get-campaign-membership.use-case';
import { InviteToCampaignUseCase } from './application/use-cases/invite-to-campaign.use-case';
import { LeaveCampaignUseCase } from './application/use-cases/leave-campaign.use-case';
import { ListCampaignInvitationsUseCase } from './application/use-cases/list-campaign-invitations.use-case';
import { ListMyCampaignsUseCase } from './application/use-cases/list-my-campaigns.use-case';
import { PromoteCampaignMemberUseCase } from './application/use-cases/promote-campaign-member.use-case';
import { RefuseCampaignInvitationUseCase } from './application/use-cases/refuse-campaign-invitation.use-case';
import { RemoveCampaignMemberUseCase } from './application/use-cases/remove-campaign-member.use-case';
import { SelfDemoteCampaignOwnerUseCase } from './application/use-cases/self-demote-campaign-owner.use-case';
import { SelfPromoteCampaignOwnerUseCase } from './application/use-cases/self-promote-campaign-owner.use-case';
import { TransferCampaignOwnershipUseCase } from './application/use-cases/transfer-campaign-ownership.use-case';
import { FriendshipChecker } from './infrastructure/acl/friendship-checker';
import { UserCampaignDirectory } from './infrastructure/acl/user-campaign-directory';
import {
  CAMPAIGN_MEMBERSHIP_MODEL,
  CampaignMembershipSchema,
} from './infrastructure/persistence/campaign-membership.schema';
import {
  CAMPAIGN_MODEL,
  CampaignSchema,
} from './infrastructure/persistence/campaign.schema';
import { MongoCampaignEnvelopeRepository } from './infrastructure/persistence/mongo-campaign-envelope.repository';
import { MongoCampaignRepository } from './infrastructure/persistence/mongo-campaign.repository';
import { MongoCampaignPersistenceRepository } from './infrastructure/persistence/mongo-campaign-persistence.repository';
import { CampaignController } from './presentation/campaign.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CAMPAIGN_MODEL, schema: CampaignSchema },
      { name: CAMPAIGN_MEMBERSHIP_MODEL, schema: CampaignMembershipSchema },
      { name: COMMAND_RECEIPT_MODEL, schema: CommandReceiptSchema },
      { name: FUNCTIONAL_AUDIT_ENTRY_MODEL, schema: FunctionalAuditEntrySchema },
      { name: OUTBOX_MESSAGE_MODEL, schema: OutboxMessageSchema },
    ]),
    UserModule,
    FriendshipModule,
    ClockModule,
  ],
  controllers: [CampaignController],
  providers: [
    { provide: CAMPAIGN_REPOSITORY, useClass: MongoCampaignRepository },
    MongoCampaignPersistenceRepository,
    MongoCampaignEnvelopeRepository,
    // Les deux seuls providers qui traversent vers un module voisin.
    { provide: CAMPAIGN_DIRECTORY, useClass: UserCampaignDirectory },
    { provide: FRIENDSHIP_CHECKER, useClass: FriendshipChecker },
    CreateCampaignUseCase,
    ListMyCampaignsUseCase,
    ListCampaignInvitationsUseCase,
    CountCampaignInvitationsUseCase,
    GetCampaignDetailUseCase,
    GetCampaignMembershipUseCase,
    InviteToCampaignUseCase,
    AcceptCampaignInvitationUseCase,
    RefuseCampaignInvitationUseCase,
    PromoteCampaignMemberUseCase,
    DemoteCampaignMemberUseCase,
    RemoveCampaignMemberUseCase,
    SelfPromoteCampaignOwnerUseCase,
    SelfDemoteCampaignOwnerUseCase,
    TransferCampaignOwnershipUseCase,
    LeaveCampaignUseCase,
    DeleteCampaignUseCase,
  ],
  exports: [GetCampaignMembershipUseCase],
})
export class CampaignsModule {}
