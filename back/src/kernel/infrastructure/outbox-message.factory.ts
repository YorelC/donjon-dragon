import { randomUUID } from 'crypto';

import {
  OUTBOX_AUDIENCE_POLICY,
  OUTBOX_STATUS,
  type CampaignOutboxAudience,
  type OutboxDeliveryChannel,
  type UserOutboxAudience,
} from './outbox-message.contract';
import type { OutboxMessageDocument } from './outbox-message.schema';

const SCHEMA_VERSION = 1;

interface OutboxMessageInputBase {
  ownerModule: string;
  causationId: string;
  aggregateId: string;
  aggregateRevision: number;
  factType: string;
  fact: unknown;
  deliveryChannel: OutboxDeliveryChannel;
  occurredAt: Date;
}

export type OutboxMessageInput =
  | (OutboxMessageInputBase & {
      campaignId: string;
      audience: CampaignOutboxAudience;
    })
  | (OutboxMessageInputBase & {
      campaignId?: never;
      audience: UserOutboxAudience;
    });

export function createOutboxMessage(
  input: OutboxMessageInput,
): OutboxMessageDocument {
  assertAudienceInvariant(input);
  return {
    ...messageIdentity(input),
    ...messageContent(input),
    ...deliveryState(input),
  };
}

function messageIdentity(input: OutboxMessageInput) {
  return {
    _id: randomUUID(),
    schemaVersion: SCHEMA_VERSION,
    ownerModule: input.ownerModule,
    ...campaignIdentity(input),
    causationId: input.causationId,
    aggregateId: input.aggregateId,
    aggregateRevision: input.aggregateRevision,
  };
}

function messageContent(input: OutboxMessageInput) {
  return {
    factType: input.factType,
    fact: input.fact,
    deliveryChannel: input.deliveryChannel,
    audiencePolicy: input.audience.policy,
    audienceUserIds: audienceUserIds(input.audience),
  };
}

function deliveryState(input: OutboxMessageInput) {
  return {
    status: OUTBOX_STATUS.pending,
    availableAt: input.occurredAt,
    leaseUntil: null,
    createdAt: input.occurredAt,
    updatedAt: input.occurredAt,
  };
}

function assertAudienceInvariant(input: OutboxMessageInput): void {
  if (!isCampaignAudience(input.audience.policy)) return;
  if (input.campaignId) return;
  throw new Error('Une audience de campagne exige campaignId');
}

function isCampaignAudience(policy: string): boolean {
  return policy === OUTBOX_AUDIENCE_POLICY.campaignMembers ||
    policy === OUTBOX_AUDIENCE_POLICY.campaignGameMasters;
}

function campaignIdentity(input: OutboxMessageInput) {
  return input.campaignId ? { campaignId: input.campaignId } : {};
}

function audienceUserIds(audience: OutboxMessageInput['audience']): string[] {
  return audience.policy === OUTBOX_AUDIENCE_POLICY.targetUser ||
    audience.policy === OUTBOX_AUDIENCE_POLICY.friendshipParticipants
    ? [...audience.userIds]
    : [];
}
