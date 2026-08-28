import type { Model } from 'mongoose';
import { describe, expect, it, vi } from 'vitest';
import type { Clock } from '@kernel/application/clock.port';
import {
  OUTBOX_AUDIENCE_POLICY,
  OUTBOX_DELIVERY_CHANNEL,
  OUTBOX_STATUS,
  type OutboxAudience,
} from '@kernel/infrastructure/outbox-message.contract';
import { createOutboxMessage } from '@kernel/infrastructure/outbox-message.factory';
import type { OutboxMessageDocument } from '@kernel/infrastructure/outbox-message.schema';
import type { RealtimeNotifierPort } from '../application/ports/realtime-notifier.port';
import { RealtimeOutboxRelay } from './realtime-outbox.relay';

const MESSAGE_ID_PATTERN = /^[0-9a-f-]{36}$/u;
const ALICE_ID = '11111111-1111-4111-8111-111111111111';
const BOB_ID = '22222222-2222-4222-8222-222222222222';
const CAMPAIGN_ID = '33333333-3333-4333-8333-333333333333';
const NOW = new Date('2026-08-28T10:00:00.000Z');

describe('RealtimeOutboxRelay', () => {
  it('diffuse une invalidation puis marque le message livré', async () => {
    const updateOne = vi.fn().mockResolvedValue({});
    const notifier = aNotifier();
    const relay = relayFor(friendshipMessage(), notifier, updateOne);

    await expect(relay.drainOnce()).resolves.toBe(true);

    expect(notifier.notifyUsers).toHaveBeenCalledWith(
      [ALICE_ID, BOB_ID],
      { messageId: expect.stringMatching(MESSAGE_ID_PATTERN), resource: 'friendships' },
    );
    expect(statusWrittenBy(updateOne)).toBe(OUTBOX_STATUS.delivered);
  });

  // Le relais routait sur `ownerModule: 'friendship'` : les invitations de campagne,
  // pourtant ecrites en canal temps reel, restaient `pending` a vie.
  it('diffuse une invitation de campagne vers son destinataire', async () => {
    const notifier = aNotifier();
    const relay = relayFor(invitationMessage(), notifier);

    await relay.drainOnce();

    expect(notifier.notifyUsers).toHaveBeenCalledWith(
      [BOB_ID],
      expect.objectContaining({ resource: 'campaign-invitations' }),
    );
  });

  it('ne revendique que le canal temps réel et les audiences résolvables', async () => {
    const { relay, findOneAndUpdate } = emptyOutbox();

    await relay.drainOnce();

    expect(findOneAndUpdate.mock.calls[0]?.[0]).toMatchObject({
      deliveryChannel: OUTBOX_DELIVERY_CHANNEL.realtime,
      audiencePolicy: {
        $in: [
          OUTBOX_AUDIENCE_POLICY.friendshipParticipants,
          OUTBOX_AUDIENCE_POLICY.targetUser,
        ],
      },
    });
  });

  // Une faute de frappe dans un type de fait ne doit jamais produire une diffusion
  // par defaut : politique inconnue, aucune diffusion.
  it('met en quarantaine un fait absent de la table, sans rien diffuser', async () => {
    const updateOne = vi.fn().mockResolvedValue({});
    const notifier = aNotifier();
    const relay = relayFor(unknownFactMessage(), notifier, updateOne);

    await relay.drainOnce();

    expect(notifier.notifyUsers).not.toHaveBeenCalled();
    expect(statusWrittenBy(updateOne)).toBe(OUTBOX_STATUS.quarantined);
  });

  it('met en quarantaine une enveloppe sans destinataire', async () => {
    const updateOne = vi.fn().mockResolvedValue({});
    const message = { ...friendshipMessage(), audienceUserIds: [] };
    const relay = relayFor(message, aNotifier(), updateOne);

    await relay.drainOnce();

    expect(statusWrittenBy(updateOne)).toBe(OUTBOX_STATUS.quarantined);
  });

  it('ne draine rien quand l outbox est vide', async () => {
    await expect(emptyOutbox().relay.drainOnce()).resolves.toBe(false);
  });
});

function friendshipMessage(): OutboxMessageDocument {
  return userMessage('friendship.requested', {
    policy: OUTBOX_AUDIENCE_POLICY.friendshipParticipants,
    userIds: [ALICE_ID, BOB_ID],
  });
}

function unknownFactMessage(): OutboxMessageDocument {
  return userMessage('friendship.blocked', {
    policy: OUTBOX_AUDIENCE_POLICY.friendshipParticipants,
    userIds: [ALICE_ID, BOB_ID],
  });
}

function invitationMessage(): OutboxMessageDocument {
  return createOutboxMessage({
    ownerModule: 'campaigns',
    campaignId: CAMPAIGN_ID,
    causationId: 'command-2',
    aggregateId: 'invitation-1',
    aggregateRevision: 0,
    factType: 'campaign.invitation.created',
    fact: {},
    audience: { policy: OUTBOX_AUDIENCE_POLICY.targetUser, userIds: [BOB_ID] },
    deliveryChannel: OUTBOX_DELIVERY_CHANNEL.realtime,
    occurredAt: NOW,
  });
}

function userMessage(
  factType: string,
  audience: Extract<OutboxAudience, { userIds: readonly string[] }>,
): OutboxMessageDocument {
  return createOutboxMessage({
    ownerModule: 'friendship',
    causationId: 'command-1',
    aggregateId: 'friendship-1',
    aggregateRevision: 0,
    factType,
    fact: {},
    audience,
    deliveryChannel: OUTBOX_DELIVERY_CHANNEL.realtime,
    occurredAt: NOW,
  });
}

function aNotifier(): RealtimeNotifierPort {
  return { notifyUsers: vi.fn() };
}

function relayFor(
  message: OutboxMessageDocument,
  notifier: RealtimeNotifierPort,
  updateOne: ReturnType<typeof vi.fn> = vi.fn().mockResolvedValue({}),
): RealtimeOutboxRelay {
  return new RealtimeOutboxRelay(
    outboxModel(message, updateOne),
    fixedClock(),
    notifier,
  );
}

function emptyOutbox() {
  const findOneAndUpdate = vi.fn((_filter: unknown) => ({
    lean: () => Promise.resolve(null),
  }));
  const model = {
    findOneAndUpdate,
    updateOne: vi.fn().mockResolvedValue({}),
  } as unknown as Model<OutboxMessageDocument>;

  return {
    relay: new RealtimeOutboxRelay(model, fixedClock(), aNotifier()),
    findOneAndUpdate,
  };
}

function statusWrittenBy(updateOne: ReturnType<typeof vi.fn>): string {
  const update = updateOne.mock.calls[0]?.[1] as { $set: { status: string } };
  return update.$set.status;
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
