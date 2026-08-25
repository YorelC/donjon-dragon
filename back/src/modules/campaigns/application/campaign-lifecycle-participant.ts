import type { UserId } from '@kernel/domain/user-id';

export interface CampaignTransactionContext {
  readonly handle: unknown;
}

export interface CampaignMutationParticipantRequest {
  transaction: CampaignTransactionContext;
  campaignId: string;
  userId: UserId;
  occurredAt: Date;
}

export type CampaignMutationParticipant = (
  request: CampaignMutationParticipantRequest,
) => Promise<string[]>;
