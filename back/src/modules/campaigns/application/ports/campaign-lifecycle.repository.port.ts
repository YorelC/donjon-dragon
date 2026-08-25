import type { CampaignCommandResult } from '@donjon-dragon/shared/campaign-schema';
import type { UserId } from '@kernel/domain/user-id';

import type { Campaign } from '../../domain/campaign';
import type { CampaignMutationParticipant } from '../campaign-lifecycle-participant';

export const CAMPAIGN_LIFECYCLE_REPOSITORY = Symbol(
  'CAMPAIGN_LIFECYCLE_REPOSITORY',
);

export type CampaignLifecycleFact =
  | 'campaign.member-promoted'
  | 'campaign.member-demoted'
  | 'campaign.member-excluded'
  | 'campaign.ownership-transferred'
  | 'campaign.member-left';

export interface CampaignLifecycleCommand {
  campaign: Campaign;
  principalId: UserId;
  participantUserId: UserId;
  idempotencyKey: string;
  intentHash: string;
  occurredAt: Date;
  effectiveRole: string;
  factType: CampaignLifecycleFact;
  result: CampaignCommandResult;
}

export interface CampaignLifecycleReceipt {
  intentHash: string;
  result: CampaignCommandResult | null;
}

export interface CampaignLifecycleRepositoryPort {
  promote(
    command: CampaignLifecycleCommand,
    participant: CampaignMutationParticipant,
  ): Promise<CampaignLifecycleReceipt>;
  demote(command: CampaignLifecycleCommand): Promise<CampaignLifecycleReceipt>;
  exclude(
    command: CampaignLifecycleCommand,
    participant: CampaignMutationParticipant,
  ): Promise<CampaignLifecycleReceipt>;
  transfer(command: CampaignLifecycleCommand): Promise<CampaignLifecycleReceipt>;
  leave(
    command: CampaignLifecycleCommand,
    participant: CampaignMutationParticipant,
  ): Promise<CampaignLifecycleReceipt>;
  findReceipt(
    principalId: UserId,
    idempotencyKey: string,
  ): Promise<CampaignLifecycleReceipt | null>;
}
