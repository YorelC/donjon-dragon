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
import type { CampaignAudiencePort } from '../application/ports/campaign-audience.port';
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

  // Le canal `email` porte les demandes d'invitation par courriel : elles ne
  // sont pas du ressort du relais temps reel.
  it('ne revendique que le canal temps réel', async () => {
    const { relay, findOneAndUpdate } = emptyOutbox();

    await relay.drainOnce();

    expect(findOneAndUpdate.mock.calls[0]?.[0]).toMatchObject({
      deliveryChannel: OUTBOX_DELIVERY_CHANNEL.realtime,
    });
    expect(findOneAndUpdate.mock.calls[0]?.[0]).not.toHaveProperty('audiencePolicy');
  });

  // La 5D exige que toute audience dependant d'une adhesion soit recalculee
  // depuis les donnees autoritaires a chaque emission.
  it('résout campaign-members depuis les adhésions actives de la campagne', async () => {
    const notifier = aNotifier();
    const audience = anAudience([ALICE_ID, BOB_ID]);
    const relay = relayFor(
      campaignFactMessage('campaign.invitation.created'),
      notifier, vi.fn().mockResolvedValue({}), audience,
    );

    await relay.drainOnce();

    expect(audience.activeMemberIds).toHaveBeenCalledWith(CAMPAIGN_ID);
    expect(notifier.notifyUsers).toHaveBeenCalledWith(
      [ALICE_ID, BOB_ID],
      expect.objectContaining({ resource: 'campaign-invitations' }),
    );
  });

  // Une exclusion retire le destinataire des la diffusion suivante, meme si sa
  // socket est encore ouverte : c'est tout l'interet de relire a l'emission.
  it('exclut un membre qui n est plus actif au moment de l émission', async () => {
    const notifier = aNotifier();
    const relay = relayFor(
      campaignFactMessage('campaign.invitation.created'),
      notifier, vi.fn().mockResolvedValue({}), anAudience([ALICE_ID]),
    );

    await relay.drainOnce();

    expect(notifier.notifyUsers).toHaveBeenCalledWith([ALICE_ID], expect.anything());
  });

  // NEW-14 : l'attribution d'un personnage ecrit bien en campaign-members, mais
  // aucune ressource navigateur ne lui correspond. L'ecart devient bruyant.
  it('met en quarantaine une attribution de personnage, faute de ressource', async () => {
    const updateOne = vi.fn().mockResolvedValue({});
    const notifier = aNotifier();
    const relay = relayFor(
      campaignFactMessage('character.assigned'), notifier, updateOne,
    );

    await relay.drainOnce();

    expect(notifier.notifyUsers).not.toHaveBeenCalled();
    expect(statusWrittenBy(updateOne)).toBe(OUTBOX_STATUS.quarantined);
  });

  it('met en quarantaine un fait de campagne sans campaignId', async () => {
    const updateOne = vi.fn().mockResolvedValue({});
    const message = { ...campaignFactMessage('campaign.invitation.created') };
    delete message.campaignId;
    const relay = relayFor(message, aNotifier(), updateOne);

    await relay.drainOnce();

    expect(statusWrittenBy(updateOne)).toBe(OUTBOX_STATUS.quarantined);
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

  // L'arret survient avant la fermeture des connexions : le poll en vol doit
  // avoir fini d'ecrire, sinon son message reste `processing` jusqu'au bail.
  it('attend la fin du poll en cours avant de rendre la main', async () => {
    const { relay, releaseClaim, drained } = pausedOutbox();
    relay.onApplicationBootstrap();

    const stopped = relay.onModuleDestroy();
    releaseClaim();
    await stopped;

    expect(drained()).toBe(true);
  });
});

/** Un outbox dont la reclamation ne se resout que sur ordre du test. */
function pausedOutbox() {
  let release = (): void => {};
  const claimed = new Promise<null>((resolve) => {
    release = () => resolve(null);
  });
  let finished = false;
  const model = {
    findOneAndUpdate: vi.fn(() => ({
      lean: () => claimed.then((value) => {
        finished = true;
        return value;
      }),
    })),
    updateOne: vi.fn().mockResolvedValue({}),
  } as unknown as Model<OutboxMessageDocument>;

  return {
    relay: new RealtimeOutboxRelay(model, fixedClock(), aNotifier(), anAudience()),
    releaseClaim: () => release(),
    drained: () => finished,
  };
}

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

/** Un fait de campagne : ses destinataires ne sont PAS dans l'enveloppe. */
function campaignFactMessage(factType: string): OutboxMessageDocument {
  return createOutboxMessage({
    ownerModule: 'characters',
    campaignId: CAMPAIGN_ID,
    causationId: 'command-3',
    aggregateId: 'character-1',
    aggregateRevision: 1,
    factType,
    fact: {},
    audience: { policy: OUTBOX_AUDIENCE_POLICY.campaignMembers },
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

/** Les adhesions relues a l'emission : le test choisit ce que la campagne rend. */
function anAudience(
  memberIds: readonly string[] = [ALICE_ID, BOB_ID],
  gameMasterIds: readonly string[] = [ALICE_ID],
): CampaignAudiencePort {
  return {
    activeMemberIds: vi.fn().mockResolvedValue(memberIds),
    activeGameMasterIds: vi.fn().mockResolvedValue(gameMasterIds),
  };
}

function relayFor(
  message: OutboxMessageDocument,
  notifier: RealtimeNotifierPort,
  updateOne: ReturnType<typeof vi.fn> = vi.fn().mockResolvedValue({}),
  audience: CampaignAudiencePort = anAudience(),
): RealtimeOutboxRelay {
  return new RealtimeOutboxRelay(
    outboxModel(message, updateOne),
    fixedClock(),
    notifier,
    audience,
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
    relay: new RealtimeOutboxRelay(model, fixedClock(), aNotifier(), anAudience()),
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
