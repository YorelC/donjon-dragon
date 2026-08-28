import type { Model } from 'mongoose';
import { describe, expect, it, vi } from 'vitest';
import type { Clock } from '@kernel/application/clock.port';
import {
  OUTBOX_AUDIENCE_POLICY,
  OUTBOX_DELIVERY_CHANNEL,
  OUTBOX_STATUS,
} from '@kernel/infrastructure/outbox-message.contract';
import { createOutboxMessage } from '@kernel/infrastructure/outbox-message.factory';
import type { OutboxMessageDocument } from '@kernel/infrastructure/outbox-message.schema';
import type { RealtimeGateway } from '../presentation/realtime.gateway';
import { RealtimeOutboxRelay } from './realtime-outbox.relay';

const MESSAGE_ID_PATTERN = /^[0-9a-f-]{36}$/u;
const ALICE_ID = '11111111-1111-4111-8111-111111111111';
const BOB_ID = '22222222-2222-4222-8222-222222222222';
const NOW = new Date('2026-08-28T10:00:00.000Z');

describe('RealtimeOutboxRelay', () => {
  it('diffuse une invalidation puis marque le message livré', async () => {
    const message = friendshipMessage();
    const updateOne = vi.fn().mockResolvedValue({});
    const notifyUsers = vi.fn();
    const relay = new RealtimeOutboxRelay(
      outboxModel(message, updateOne),
      fixedClock(),
      { notifyUsers } as unknown as RealtimeGateway,
    );

    await expect(relay.drainOnce()).resolves.toBe(true);

    expect(notifyUsers).toHaveBeenCalledWith(
      [ALICE_ID, BOB_ID],
      { messageId: expect.stringMatching(MESSAGE_ID_PATTERN), resource: 'friendships' },
    );
    expect(updateOne.mock.calls[0]?.[1]).toMatchObject({
      $set: { status: OUTBOX_STATUS.delivered },
    });
  });
});

function friendshipMessage(): OutboxMessageDocument {
  return createOutboxMessage({
    ownerModule: 'friendship',
    causationId: 'command-1',
    aggregateId: 'friendship-1',
    aggregateRevision: 0,
    factType: 'friendship.requested',
    fact: {},
    audience: {
      policy: OUTBOX_AUDIENCE_POLICY.friendshipParticipants,
      userIds: [ALICE_ID, BOB_ID],
    },
    deliveryChannel: OUTBOX_DELIVERY_CHANNEL.realtime,
    occurredAt: NOW,
  });
}

function outboxModel(
  message: OutboxMessageDocument,
  updateOne: ReturnType<typeof vi.fn>,
): Model<OutboxMessageDocument> {
  return {
    findOneAndUpdate: vi.fn(() => ({ lean: () => Promise.resolve(message) })),
    updateOne,
  } as unknown as Model<OutboxMessageDocument>;
}

function fixedClock(): Clock {
  return { now: () => NOW };
}
