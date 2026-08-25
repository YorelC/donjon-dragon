import { randomUUID } from 'crypto';
import { describe, expect, it, vi } from 'vitest';
import type { ClientSession, Model } from 'mongoose';
import type {
  CommandReceiptDocument,
} from '@kernel/infrastructure/command-receipt.schema';
import type {
  FunctionalAuditEntryDocument,
} from '@kernel/infrastructure/functional-audit-entry.schema';
import type {
  OutboxMessageDocument,
} from '@kernel/infrastructure/outbox-message.schema';
import { UserId } from '@kernel/domain/user-id';
import { TEST_INSTANT } from '@kernel/testing/fixed-clock';

import type { CampaignLifecycleCommand } from '../../application/ports/campaign-lifecycle.repository.port';
import { aCampaign, withPlayer } from '../../testing/campaign.fixture';
import { MongoCampaignLifecycleEnvelopeRepository } from './mongo-campaign-lifecycle-envelope.repository';

describe('MongoCampaignLifecycleEnvelopeRepository', () => {
  it('écrit reçu, audit et fait outbox dans la même session', async () => {
    const fixtures = envelopeFixtures();
    const repository = repositoryWith(fixtures);

    await repository.write(fixtures.command, [fixtures.characterId], fixtures.session);

    expect(createdDocument(fixtures.receiptCreate)).toMatchObject({
      intentionType: 'campaign.member-promoted',
      intentHash: fixtures.command.intentHash,
      result: fixtures.command.result,
      aggregateIds: [fixtures.command.campaign.id.value, fixtures.characterId],
    });
    expect(createdDocument(fixtures.auditCreate)).toMatchObject({
      action: 'campaign.member-promoted',
      revisionBefore: 1,
      revisionAfter: 2,
      audiences: ['campaign-members'],
    });
    expect(createdDocument(fixtures.outboxCreate)).toMatchObject({
      factType: 'campaign.member-promoted',
      aggregateRevision: 2,
      audiencePolicy: 'campaign-members',
      fact: { campaignId: fixtures.command.campaign.id.value, revision: 2 },
    });
    assertSameSession(fixtures);
  });
});

interface EnvelopeFixtures {
  command: CampaignLifecycleCommand;
  characterId: string;
  session: ClientSession;
  receiptCreate: CreateDocuments<CommandReceiptDocument>;
  auditCreate: CreateDocuments<FunctionalAuditEntryDocument>;
  outboxCreate: CreateDocuments<OutboxMessageDocument>;
}

type CreateDocuments<T> = ReturnType<typeof createDocuments<T>>;

function envelopeFixtures(): EnvelopeFixtures {
  const ownerId = randomUUID();
  const playerId = randomUUID();
  const campaign = withPlayer(aCampaign(ownerId), ownerId, playerId);
  campaign.promote(UserId.create(ownerId), UserId.create(playerId), TEST_INSTANT);
  return {
    command: commandFor(campaign, ownerId, playerId),
    characterId: randomUUID(),
    session: {} as ClientSession,
    receiptCreate: createDocuments<CommandReceiptDocument>(),
    auditCreate: createDocuments<FunctionalAuditEntryDocument>(),
    outboxCreate: createDocuments<OutboxMessageDocument>(),
  };
}

function commandFor(
  campaign: ReturnType<typeof aCampaign>,
  ownerId: string,
  playerId: string,
): CampaignLifecycleCommand {
  return {
    campaign,
    principalId: UserId.create(ownerId),
    participantUserId: UserId.create(playerId),
    idempotencyKey: randomUUID(),
    intentHash: 'intent-hash',
    occurredAt: TEST_INSTANT,
    effectiveRole: 'gameMaster',
    factType: 'campaign.member-promoted',
    result: {
      campaignId: campaign.id.value,
      revision: campaign.revision,
      actor: { membership: 'active', role: 'gameMaster', isOwner: true },
      target: {
        displayName: 'Frodon',
        membership: 'active',
        role: 'gameMaster',
        isOwner: false,
      },
    },
  };
}

function repositoryWith(fixtures: EnvelopeFixtures) {
  return new MongoCampaignLifecycleEnvelopeRepository(
    modelWith(fixtures.receiptCreate),
    modelWith(fixtures.auditCreate),
    modelWith(fixtures.outboxCreate),
  );
}

function createDocuments<T>() {
  return vi.fn(async (_documents: T[], _options: { session: ClientSession }) => []);
}

function modelWith<T>(create: CreateDocuments<T>): Model<T> {
  return { create } as unknown as Model<T>;
}

function createdDocument<T>(create: CreateDocuments<T>): T | undefined {
  return create.mock.calls[0]?.[0][0];
}

function assertSameSession(fixtures: EnvelopeFixtures): void {
  const expected = { session: fixtures.session };
  expect(fixtures.receiptCreate.mock.calls[0]?.[1]).toEqual(expected);
  expect(fixtures.auditCreate.mock.calls[0]?.[1]).toEqual(expected);
  expect(fixtures.outboxCreate.mock.calls[0]?.[1]).toEqual(expected);
}
