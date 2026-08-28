import { describe, expect, it } from 'vitest';

import {
  OUTBOX_AUDIENCE_POLICY,
  OUTBOX_DELIVERY_CHANNEL,
  OUTBOX_STATUS,
} from './outbox-message.contract';
import {
  createOutboxMessage,
  type OutboxMessageInput,
} from './outbox-message.factory';

const OCCURRED_AT = new Date('2026-08-28T10:00:00.000Z');

describe('createOutboxMessage', () => {
  it('construit un message utilisateur sans campaignId', () => {
    const message = createOutboxMessage(userMessage());

    expect(message.campaignId).toBeUndefined();
    expect(message.audienceUserIds).toEqual(['user-1']);
    expect(message.status).toBe(OUTBOX_STATUS.pending);
  });

  it('construit une audience campagne avec une seule source de campaignId', () => {
    const message = createOutboxMessage(campaignMessage());

    expect(message.campaignId).toBe('campaign-1');
    expect(message.audienceUserIds).toEqual([]);
  });

  it('conserve les deux participants immuables de l’amitié', () => {
    const message = createOutboxMessage(friendshipMessage());

    expect(message.campaignId).toBeUndefined();
    expect(message.audienceUserIds).toEqual(['user-1', 'user-2']);
  });

  it('refuse à l’exécution une audience campagne sans campaignId', () => {
    const invalid = {
      ...baseMessage(),
      audience: { policy: OUTBOX_AUDIENCE_POLICY.campaignMembers },
    } as unknown as OutboxMessageInput;

    expect(() => createOutboxMessage(invalid)).toThrow('exige campaignId');
  });
});

function userMessage(): OutboxMessageInput {
  return {
    ...baseMessage(),
    audience: {
      policy: OUTBOX_AUDIENCE_POLICY.targetUser,
      userIds: ['user-1'],
    },
  };
}

function campaignMessage(): OutboxMessageInput {
  return {
    ...baseMessage(),
    campaignId: 'campaign-1',
    audience: { policy: OUTBOX_AUDIENCE_POLICY.campaignMembers },
  };
}

function friendshipMessage(): OutboxMessageInput {
  return {
    ...baseMessage(),
    audience: {
      policy: OUTBOX_AUDIENCE_POLICY.friendshipParticipants,
      userIds: ['user-1', 'user-2'],
    },
  };
}

function baseMessage() {
  return {
    ownerModule: 'friendship',
    causationId: 'receipt-1',
    aggregateId: 'aggregate-1',
    aggregateRevision: 1,
    factType: 'friendship.changed',
    fact: {},
    deliveryChannel: OUTBOX_DELIVERY_CHANNEL.realtime,
    occurredAt: OCCURRED_AT,
  };
}
