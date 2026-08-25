import { randomUUID } from 'crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createConnection,
  type Connection,
  type Model,
} from 'mongoose';
import { UserId } from '@kernel/domain/user-id';
import { TEST_INSTANT } from '@kernel/testing/fixed-clock';
import {
  COMMAND_RECEIPT_MODEL,
  CommandReceiptSchema,
  type CommandReceiptDocument,
} from '@kernel/infrastructure/command-receipt.schema';
import {
  FUNCTIONAL_AUDIT_ENTRY_MODEL,
  FunctionalAuditEntrySchema,
  type FunctionalAuditEntryDocument,
} from '@kernel/infrastructure/functional-audit-entry.schema';
import {
  OUTBOX_MESSAGE_MODEL,
  OutboxMessageSchema,
  type OutboxMessageDocument,
} from '@kernel/infrastructure/outbox-message.schema';
import type { CampaignMutationParticipant } from '@modules/campaigns/application/campaign-lifecycle-participant';
import { toCampaignCommandResult } from '@modules/campaigns/application/campaign-command.mapper';
import type { Campaign } from '@modules/campaigns/domain/campaign';
import { CampaignRevisionConflictError } from '@modules/campaigns/domain/campaign.errors';
import { CampaignId } from '@modules/campaigns/domain/campaign-id';
import {
  CAMPAIGN_MEMBERSHIP_MODEL,
  CampaignMembershipSchema,
  type CampaignMembershipDocument,
} from '@modules/campaigns/infrastructure/persistence/campaign-membership.schema';
import {
  CAMPAIGN_MODEL,
  CampaignSchema,
  type CampaignDocument,
} from '@modules/campaigns/infrastructure/persistence/campaign.schema';
import { MongoCampaignLifecycleEnvelopeRepository } from '@modules/campaigns/infrastructure/persistence/mongo-campaign-lifecycle-envelope.repository';
import { MongoCampaignLifecycleRepository } from '@modules/campaigns/infrastructure/persistence/mongo-campaign-lifecycle.repository';
import { MongoCampaignPersistenceRepository } from '@modules/campaigns/infrastructure/persistence/mongo-campaign-persistence.repository';
import { aCampaign, withPlayer } from '@modules/campaigns/testing/campaign.fixture';
import { toBuildInput } from '@modules/characters/application/character-build.mapper';
import { AbilityRoll } from '@modules/characters/domain/ability-roll';
import { Character } from '@modules/characters/domain/character';
import { CharacterName } from '@modules/characters/domain/character-name';
import { OwningCampaignId } from '@modules/characters/domain/owning-campaign-id';
import type { CharacterDocument } from '@modules/characters/infrastructure/persistence/character.mapper';
import { MongoCharacterRepository } from '@modules/characters/infrastructure/persistence/mongo-character.repository';
import {
  CHARACTER_MODEL,
  CharacterSchema,
} from '@modules/characters/infrastructure/persistence/character.schema';
import { aCharacterBody } from '@modules/characters/testing/character.fixture';

const MONGO_URI = process.env.MONGODB_INTEGRATION_URI;
const describeMongo = MONGO_URI ? describe : describe.skip;

describeMongo('Campaign lifecycle — MongoDB replica set', () => {
  let harness: MongoHarness;

  beforeAll(async () => {
    harness = await connectHarness(requiredMongoUri());
  });

  afterAll(async () => {
    await harness.connection.close();
  });

  it('commit campagne, adhésion, personnage et enveloppe ensemble', async () => {
    const scenario = await persistedScenario(harness);
    promote(scenario.campaign, scenario.ownerId, scenario.playerId);
    const command = promotionCommand(scenario, randomUUID());

    await harness.lifecycle.promote(command, characterParticipant(harness.characters));

    const stored = await storedState(harness, scenario);
    expect(stored.campaign?.roleOf(UserId.create(scenario.playerId))).toBe('gameMaster');
    expect(stored.character?.assignedTo).toBeNull();
    await expectEnvelopeCounts(harness, scenario.campaign.id.value, 1);
  });

  it('annule la désassignation quand la coordination échoue', async () => {
    const scenario = await persistedScenario(harness);
    promote(scenario.campaign, scenario.ownerId, scenario.playerId);
    const command = promotionCommand(scenario, randomUUID());

    await expect(
      harness.lifecycle.promote(command, failingParticipant(harness.characters)),
    ).rejects.toThrow('coordination failure');

    const stored = await storedState(harness, scenario);
    expect(stored.campaign?.roleOf(UserId.create(scenario.playerId))).toBe('player');
    expect(stored.character?.assignedTo?.value).toBe(scenario.playerId);
    await expectEnvelopeCounts(harness, scenario.campaign.id.value, 0);
  });

  it('annule l exclusion quand la désassignation échoue', async () => {
    const scenario = await persistedScenario(harness);
    exclude(scenario.campaign, scenario.ownerId, scenario.playerId);
    const command = exclusionCommand(scenario, randomUUID());

    await expect(
      harness.lifecycle.exclude(command, failingParticipant(harness.characters)),
    ).rejects.toThrow('coordination failure');

    const stored = await storedState(harness, scenario);
    expect(stored.campaign?.roleOf(UserId.create(scenario.playerId))).toBe('player');
    expect(stored.character?.assignedTo?.value).toBe(scenario.playerId);
    await expectEnvelopeCounts(harness, scenario.campaign.id.value, 0);
  });

  it('annule l enveloppe et la seconde mutation sur conflit de révision', async () => {
    const scenario = await persistedScenario(harness);
    const winner = await reloadCampaign(harness, scenario.campaign);
    const stale = await reloadCampaign(harness, scenario.campaign);
    promote(winner, scenario.ownerId, scenario.playerId);
    promote(stale, scenario.ownerId, scenario.playerId);

    await harness.lifecycle.promote(
      promotionCommand({ ...scenario, campaign: winner }, randomUUID()),
      characterParticipant(harness.characters),
    );
    await expect(
      harness.lifecycle.promote(
        promotionCommand({ ...scenario, campaign: stale }, randomUUID()),
        characterParticipant(harness.characters),
      ),
    ).rejects.toThrow(CampaignRevisionConflictError);
    await expectEnvelopeCounts(harness, scenario.campaign.id.value, 1);
  });
});

interface MongoHarness {
  connection: Connection;
  campaigns: MongoCampaignPersistenceRepository;
  characters: MongoCharacterRepository;
  lifecycle: MongoCampaignLifecycleRepository;
  receipts: Model<CommandReceiptDocument>;
  audits: Model<FunctionalAuditEntryDocument>;
  outbox: Model<OutboxMessageDocument>;
}

interface PersistedScenario {
  campaign: Campaign;
  character: Character;
  ownerId: string;
  playerId: string;
}

async function connectHarness(uri: string): Promise<MongoHarness> {
  const connection = await createConnection(uri).asPromise();
  const models = registerModels(connection);
  await Promise.all(Object.values(models).map((model) => model.init()));
  const campaigns = new MongoCampaignPersistenceRepository(
    models.campaigns,
    models.memberships,
    connection,
  );
  const characters = new MongoCharacterRepository(models.characters);
  const envelopes = new MongoCampaignLifecycleEnvelopeRepository(
    models.receipts,
    models.audits,
    models.outbox,
  );
  return {
    connection,
    campaigns,
    characters,
    lifecycle: new MongoCampaignLifecycleRepository(campaigns, envelopes),
    receipts: models.receipts,
    audits: models.audits,
    outbox: models.outbox,
  };
}

function registerModels(connection: Connection) {
  return {
    campaigns: connection.model<CampaignDocument>(CAMPAIGN_MODEL, CampaignSchema),
    memberships: connection.model<CampaignMembershipDocument>(
      CAMPAIGN_MEMBERSHIP_MODEL,
      CampaignMembershipSchema,
    ),
    characters: connection.model<CharacterDocument>(CHARACTER_MODEL, CharacterSchema),
    receipts: connection.model<CommandReceiptDocument>(
      COMMAND_RECEIPT_MODEL,
      CommandReceiptSchema,
    ),
    audits: connection.model<FunctionalAuditEntryDocument>(
      FUNCTIONAL_AUDIT_ENTRY_MODEL,
      FunctionalAuditEntrySchema,
    ),
    outbox: connection.model<OutboxMessageDocument>(
      OUTBOX_MESSAGE_MODEL,
      OutboxMessageSchema,
    ),
  };
}

async function persistedScenario(harness: MongoHarness): Promise<PersistedScenario> {
  const ownerId = randomUUID();
  const playerId = randomUUID();
  const campaign = aCampaign(ownerId);
  await harness.campaigns.transaction((session) =>
    harness.campaigns.save(campaign, session),
  );
  withPlayer(campaign, ownerId, playerId);
  await harness.campaigns.transaction((session) =>
    harness.campaigns.save(campaign, session),
  );
  const character = assignedCharacter(campaign, ownerId, playerId);
  await harness.characters.save(character);
  return { campaign, character, ownerId, playerId };
}

function assignedCharacter(
  campaign: Campaign,
  ownerId: string,
  playerId: string,
): Character {
  const body = aCharacterBody('Mongo lifecycle proof');
  const character = Character.create({
    campaignId: OwningCampaignId.create(campaign.id.value),
    name: CharacterName.create(body.name),
    createdBy: UserId.create(ownerId),
    build: toBuildInput(body),
    roll: AbilityRoll.restore(requiredRoll(body.abilityRoll)),
    now: TEST_INSTANT,
  });
  character.assignTo(true, UserId.create(playerId), TEST_INSTANT);
  return character;
}

function promotionCommand(
  scenario: PersistedScenario,
  idempotencyKey: string,
): Parameters<MongoCampaignLifecycleRepository['promote']>[0] {
  const ownerId = UserId.create(scenario.ownerId);
  const playerId = UserId.create(scenario.playerId);
  return {
    campaign: scenario.campaign,
    principalId: ownerId,
    participantUserId: playerId,
    idempotencyKey,
    intentHash: `promotion:${idempotencyKey}`,
    occurredAt: TEST_INSTANT,
    effectiveRole: 'gameMaster',
    factType: 'campaign.member-promoted',
    result: toCampaignCommandResult(scenario.campaign, ownerId, {
      displayName: 'Mongo Player',
      userId: playerId,
    }),
  };
}

function exclusionCommand(
  scenario: PersistedScenario,
  idempotencyKey: string,
): Parameters<MongoCampaignLifecycleRepository['exclude']>[0] {
  const ownerId = UserId.create(scenario.ownerId);
  const playerId = UserId.create(scenario.playerId);
  return {
    campaign: scenario.campaign,
    principalId: ownerId,
    participantUserId: playerId,
    idempotencyKey,
    intentHash: `exclusion:${idempotencyKey}`,
    occurredAt: TEST_INSTANT,
    effectiveRole: 'gameMaster',
    factType: 'campaign.member-excluded',
    result: toCampaignCommandResult(scenario.campaign, ownerId, {
      displayName: 'Mongo Player',
      userId: playerId,
    }),
  };
}

function characterParticipant(
  characters: MongoCharacterRepository,
): CampaignMutationParticipant {
  return async (request) => {
    const campaignId = OwningCampaignId.create(request.campaignId);
    const character = await characters.findAssignedToInTransaction(
      campaignId,
      request.userId,
      request.transaction.handle,
    );
    if (!character) return [];
    character.unassignForCampaignTransition(request.occurredAt);
    await characters.saveInTransaction(character, request.transaction.handle);
    return [character.id.value];
  };
}

function failingParticipant(
  characters: MongoCharacterRepository,
): CampaignMutationParticipant {
  const participant = characterParticipant(characters);
  return async (request) => {
    await participant(request);
    throw new Error('coordination failure');
  };
}

async function storedState(harness: MongoHarness, scenario: PersistedScenario) {
  return {
    campaign: await harness.campaigns.findById(scenario.campaign.id),
    character: await harness.characters.findById(scenario.character.id),
  };
}

async function reloadCampaign(
  harness: MongoHarness,
  campaign: Campaign,
): Promise<Campaign> {
  const stored = await harness.campaigns.findById(CampaignId.create(campaign.id.value));
  if (!stored) throw new Error('Persisted campaign not found');
  return stored;
}

function promote(campaign: Campaign, ownerId: string, playerId: string): void {
  campaign.promote(
    UserId.create(ownerId),
    UserId.create(playerId),
    TEST_INSTANT,
  );
}

function exclude(campaign: Campaign, ownerId: string, playerId: string): void {
  campaign.exclude(
    UserId.create(ownerId),
    UserId.create(playerId),
    TEST_INSTANT,
  );
}

async function expectEnvelopeCounts(
  harness: MongoHarness,
  campaignId: string,
  expected: number,
): Promise<void> {
  const counts = await Promise.all([
    harness.receipts.countDocuments({ campaignId }),
    harness.audits.countDocuments({ campaignId }),
    harness.outbox.countDocuments({ campaignId }),
  ]);
  expect(counts).toEqual([expected, expected, expected]);
}

function requiredMongoUri(): string {
  if (!MONGO_URI) throw new Error('MONGODB_INTEGRATION_URI is required');
  return MONGO_URI;
}

function requiredRoll<T>(roll: T | null): T {
  if (!roll) throw new Error('Character roll is required');
  return roll;
}
