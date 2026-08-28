import { randomUUID } from 'crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createConnection, type Connection } from 'mongoose';
import { UserId } from '@kernel/domain/user-id';
import { TEST_INSTANT } from '@kernel/testing/fixed-clock';
import {
  COMMAND_RECEIPT_MODEL, CommandReceiptSchema, type CommandReceiptDocument,
} from '@kernel/infrastructure/command-receipt.schema';
import {
  FUNCTIONAL_AUDIT_ENTRY_MODEL, FunctionalAuditEntrySchema,
  type FunctionalAuditEntryDocument,
} from '@kernel/infrastructure/functional-audit-entry.schema';
import {
  OUTBOX_MESSAGE_MODEL, OutboxMessageSchema, type OutboxMessageDocument,
} from '@kernel/infrastructure/outbox-message.schema';
import { toBuildInput } from '@modules/characters/application/character-build.mapper';
import { AbilityRoll } from '@modules/characters/domain/ability-roll';
import { Character } from '@modules/characters/domain/character';
import { CharacterName } from '@modules/characters/domain/character-name';
import { CharacterRevisionConflictError } from '@modules/characters/domain/character.errors';
import { OwningCampaignId } from '@modules/characters/domain/owning-campaign-id';
import type { CharacterDocument } from '@modules/characters/infrastructure/persistence/character.mapper';
import { MongoCharacterAssignmentRepository } from '@modules/characters/infrastructure/persistence/mongo-character-assignment.repository';
import { MongoCharacterRepository } from '@modules/characters/infrastructure/persistence/mongo-character.repository';
import {
  CHARACTER_MODEL, CharacterSchema,
} from '@modules/characters/infrastructure/persistence/character.schema';
import {
  A_CHARACTER_IDENTITY,
  aCharacterBody,
} from '@modules/characters/testing/character.fixture';

const MONGO_URI = process.env.MONGODB_INTEGRATION_URI;
const describeMongo = MONGO_URI ? describe : describe.skip;

describeMongo('Character assignment — MongoDB replica set', () => {
  let harness: MongoHarness;

  beforeAll(async () => {
    harness = await connectHarness(requiredMongoUri());
  });

  afterAll(async () => {
    await harness.connection.close();
  });

  it('remplace deux personnages et enveloppe dans une transaction', async () => {
    const state = await persistedPair(harness);
    const command = replacementCommand(state);
    await harness.assignments.execute(command);
    expect((await harness.characters.findById(state.previous.id))?.assignedTo).toBeNull();
    expect((await harness.characters.findById(state.incoming.id))?.assignedTo?.value)
      .toBe(state.playerId.value);
    await expectCounts(harness, state.campaignId, [1, 1, 2]);
  });

  it('annule le premier dossier et l enveloppe si le second est conflictuel', async () => {
    const state = await persistedPair(harness);
    state.incoming.assignTo(true, state.playerId, TEST_INSTANT);
    state.incoming.unassignForCampaignTransition(TEST_INSTANT);
    const command = replacementCommand(state);
    await expect(harness.assignments.execute(command))
      .rejects.toThrow(CharacterRevisionConflictError);
    expect((await harness.characters.findById(state.previous.id))?.assignedTo?.value)
      .toBe(state.playerId.value);
    await expectCounts(harness, state.campaignId, [0, 0, 0]);
  });

  it('garantit une seule attribution concurrente par joueur', async () => {
    const campaignId = randomUUID();
    const playerId = UserId.create(randomUUID());
    const first = character(campaignId, 'Premier');
    const second = character(campaignId, 'Second');
    await Promise.all([harness.characters.save(first), harness.characters.save(second)]);
    first.assignTo(true, playerId, TEST_INSTANT);
    second.assignTo(true, playerId, TEST_INSTANT);
    const settled = await Promise.allSettled([
      harness.assignments.execute(commandFor(campaignId, playerId, first, null)),
      harness.assignments.execute(commandFor(campaignId, playerId, second, null)),
    ]);
    expect(settled.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(await harness.models.characters.countDocuments({ campaignId, assignedTo: playerId.value }))
      .toBe(1);
  });
});

interface MongoHarness {
  connection: Connection;
  characters: MongoCharacterRepository;
  assignments: MongoCharacterAssignmentRepository;
  models: ReturnType<typeof registerModels>;
}

interface PairState {
  campaignId: string;
  playerId: UserId;
  previous: Character;
  incoming: Character;
}

async function connectHarness(uri: string): Promise<MongoHarness> {
  const connection = await createConnection(uri).asPromise();
  const models = registerModels(connection);
  await Promise.all(Object.values(models).map((model) => model.init()));
  return {
    connection,
    models,
    characters: new MongoCharacterRepository(models.characters),
    assignments: new MongoCharacterAssignmentRepository(
      connection, models.characters, models.receipts, models.audits, models.outbox,
    ),
  };
}

function registerModels(connection: Connection) {
  return {
    characters: connection.model<CharacterDocument>(CHARACTER_MODEL, CharacterSchema),
    receipts: connection.model<CommandReceiptDocument>(
      COMMAND_RECEIPT_MODEL, CommandReceiptSchema,
    ),
    audits: connection.model<FunctionalAuditEntryDocument>(
      FUNCTIONAL_AUDIT_ENTRY_MODEL, FunctionalAuditEntrySchema,
    ),
    outbox: connection.model<OutboxMessageDocument>(
      OUTBOX_MESSAGE_MODEL, OutboxMessageSchema,
    ),
  };
}

async function persistedPair(harness: MongoHarness): Promise<PairState> {
  const campaignId = randomUUID();
  const playerId = UserId.create(randomUUID());
  const previous = character(campaignId, 'Ancien');
  const incoming = character(campaignId, 'Entrant');
  previous.assignTo(true, playerId, TEST_INSTANT);
  await Promise.all([harness.characters.save(previous), harness.characters.save(incoming)]);
  return { campaignId, playerId, previous, incoming };
}

function replacementCommand(
  state: PairState,
): Parameters<MongoCharacterAssignmentRepository['execute']>[0] {
  state.previous.unassignForCampaignTransition(TEST_INSTANT);
  state.incoming.assignTo(true, state.playerId, TEST_INSTANT);
  return commandFor(state.campaignId, state.playerId, state.incoming, state.previous);
}

function commandFor(
  campaignId: string,
  playerId: UserId,
  incoming: Character,
  previous: Character | null,
): Parameters<MongoCharacterAssignmentRepository['execute']>[0] {
  const idempotencyKey = randomUUID();
  return {
    campaignId, principalId: UserId.create(randomUUID()), idempotencyKey,
    intentHash: `assignment:${idempotencyKey}`, occurredAt: TEST_INSTANT,
    effectiveRole: 'gameMaster', character: incoming, previousCharacter: previous,
    facts: previous
      ? ['character.unassigned', 'character.assigned']
      : ['character.assigned'],
    result: {
      campaignId,
      character: summary(incoming, playerId),
      previousCharacter: previous ? summary(previous, null) : null,
    },
  };
}

function summary(character: Character, playerId: UserId | null) {
  return {
    id: character.id.value, revision: character.revision,
    assignedTo: playerId ? { displayName: 'Mongo Player' } : null,
  };
}

function character(campaignId: string, name: string): Character {
  const body = aCharacterBody(name);
  return Character.create({
    campaignId: OwningCampaignId.create(campaignId),
    name: CharacterName.create(body.name),
    identity: A_CHARACTER_IDENTITY,
    createdBy: UserId.create(randomUUID()),
    build: toBuildInput(body),
    roll: AbilityRoll.restore(requiredRoll(body.abilityRoll)),
    now: TEST_INSTANT,
  });
}

async function expectCounts(
  harness: MongoHarness,
  campaignId: string,
  expected: [number, number, number],
): Promise<void> {
  const counts = await Promise.all([
    harness.models.receipts.countDocuments({ campaignId }),
    harness.models.audits.countDocuments({ campaignId }),
    harness.models.outbox.countDocuments({ campaignId }),
  ]);
  expect(counts).toEqual(expected);
}

function requiredMongoUri(): string {
  if (!MONGO_URI) throw new Error('MONGODB_INTEGRATION_URI is required');
  return MONGO_URI;
}

function requiredRoll<T>(roll: T | null): T {
  if (!roll) throw new Error('Character roll is required');
  return roll;
}
