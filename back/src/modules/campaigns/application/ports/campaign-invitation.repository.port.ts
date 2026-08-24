import type { UserId } from '@kernel/domain/user-id';

import type { Campaign } from '../../domain/campaign';
import type { CampaignId } from '../../domain/campaign-id';
import type { CampaignInvitation } from '../../domain/campaign-invitation';

export const CAMPAIGN_INVITATION_REPOSITORY = Symbol(
  'CAMPAIGN_INVITATION_REPOSITORY',
);

export interface CampaignInvitationCommand {
  invitation: CampaignInvitation;
  principalId: UserId;
  idempotencyKey: string;
  intentHash: string;
  occurredAt: Date;
  effectiveRole: string | null;
}

export interface CampaignInvitationAcceptanceCommand
  extends CampaignInvitationCommand {
  campaign: Campaign;
}

export interface CampaignInvitationMutationReceipt {
  intentHash: string;
}

export interface CampaignInvitationRepositoryPort {
  create(
    command: CampaignInvitationCommand,
  ): Promise<CampaignInvitationMutationReceipt>;
  accept(
    command: CampaignInvitationAcceptanceCommand,
  ): Promise<CampaignInvitationMutationReceipt>;
  refuse(
    command: CampaignInvitationCommand,
  ): Promise<CampaignInvitationMutationReceipt>;
  cancel(
    command: CampaignInvitationCommand,
  ): Promise<CampaignInvitationMutationReceipt>;
  findReceipt(
    principalId: UserId,
    idempotencyKey: string,
  ): Promise<CampaignInvitationMutationReceipt | null>;
  findOpen(
    campaignId: CampaignId,
    targetUserId: UserId,
  ): Promise<CampaignInvitation | null>;
  listOpenForTarget(targetUserId: UserId): Promise<CampaignInvitation[]>;
  listOpenForCampaign(campaignId: CampaignId): Promise<CampaignInvitation[]>;
  countOpenForTarget(targetUserId: UserId): Promise<number>;
}
