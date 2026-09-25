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
import { hashBuildVersion } from '@modules/characters/application/character-command-intent';
import { toBuildInput } from '@modules/characters/application/character-build.mapper';
import { toCharacterReviewResult } from '@modules/characters/application/character-review.mapper';
import { Character, type CharacterAccessContext } from '@modules/characters/domain/character';
import { CharacterName } from '@modules/characters/domain/character-name';
import { CharacterRevisionConflictError } from '@modules/characters/domain/character.errors';
import { OwningCampaignId } from '@modules/characters/domain/owning-campaign-id';
import type { CharacterDocument } from '@modules/characters/infrastructure/persistence/character.mapper';
import {
  CHARACTER_BUILD_VERSION_MODEL, CharacterBuildVersionSchema,
  type CharacterBuildVersionDocument,
} from '@modules/characters/infrastructure/persistence/character-build-version.schema';
import { MongoCharacterCommandRepository } from '@modules/characters/infrastructure/persistence/mongo-character-command.repository';
import { MongoCharacterRepository } from '@modules/characters/infrastructure/persistence/mongo-character.repository';
import {
  CHARACTER_MODEL, CharacterSchema,
} from '@modules/characters/infrastructure/persistence/character.schema';
import { STANDARD_ARRAY_ROLL } from '@modules/characters/testing/character-build.fixture';
import { A_CHARACTER_IDENTITY, aCharacterBody } from '@modules/characters/testing/character.fixture';

const MONGO_URI = process.env.MONGODB_INTEGRATION_URI;
const describeMongo = MONGO_URI ? describe : describe.skip;
type CharacterCommand = Parameters<MongoCharacterCommandRepository['execute']>[0];

describeMongo('Character review — MongoDB replica set', () => {
  let harness: MongoHarness;

  beforeAll(async () => { harness = await connectHarness(requiredMongoUri()); });
  afterAll(async () => { await harness?.connection.close(); });

  it('persiste soumission, acceptation et détails personnels atomiquement', async () => {
    const state = await persistedCharacter(harness);
    const submitted = reviewCommand(state, 'character.submitted');
    await harness.commands.execute(submitted);
    const accepted = reviewCommand(state, 'character.accepted');
    await harness.commands.execute(accepted);
    const updated = personalDetailsCommand(state);
    await harness.commands.execute(updated);

    const stored = await harness.characters.findById(state.character.id);
    expect(stored?.identity).toMatchObject({ age: 34, weightKg: 19 });
    await expectCounts(harness, state.campaignId, [3, 3, 3, 1]);
  });

  it('annule reçu, version, audit et outbox lors d un conflit de révision', async () => {
    const state = await persistedCharacter(harness);
    const command = reviewCommand(state, 'character.submitted');
    const competing = Character.restore({ ...state.beforeSubmission });
    competing.unassign(true, TEST_INSTANT);
    await harness.characters.save(competing);

    await expect(harness.commands.execute(command)).rejects.toThrow(CharacterRevisionConflictError);
    await expectCounts(harness, state.campaignId, [0, 0, 0, 0]);
  });
});

interface MongoHarness {
  connection: Connection;
  characters: MongoCharacterRepository;
  commands: MongoCharacterCommandRepository;
  models: ReturnType<typeof registerModels>;
}

interface ReviewState {
  campaignId: string;
  playerId: UserId;
  gameMasterId: UserId;
  character: Character;
  beforeSubmission: ReturnType<Character['snapshot']>;
}

async function connectHarness(uri: string): Promise<MongoHarness> {
  const connection = await createConnection(uri).asPromise();
  const models = registerModels(connection);
  await Promise.all(Object.values(models).map((model) => model.init()));
  return {
    connection, models, characters: new MongoCharacterRepository(models.characters),
    commands: new MongoCharacterCommandRepository(
      connection, models.characters, models.versions, models.receipts, models.audits, models.outbox,
    ),
  };
}

function registerModels(connection: Connection) {
  return {
    characters: connection.model<CharacterDocument>(CHARACTER_MODEL, CharacterSchema),
    versions: connection.model<CharacterBuildVersionDocument>(
      CHARACTER_BUILD_VERSION_MODEL, CharacterBuildVersionSchema,
    ),
    receipts: connection.model<CommandReceiptDocument>(COMMAND_RECEIPT_MODEL, CommandReceiptSchema),
    audits: connection.model<FunctionalAuditEntryDocument>(
      FUNCTIONAL_AUDIT_ENTRY_MODEL, FunctionalAuditEntrySchema,
    ),
    outbox: connection.model<OutboxMessageDocument>(OUTBOX_MESSAGE_MODEL, OutboxMessageSchema),
  };
}

async function persistedCharacter(harness: MongoHarness): Promise<ReviewState> {
  const campaignId = randomUUID();
  const playerId = UserId.create(randomUUID());
  const gameMasterId = UserId.create(randomUUID());
  const body = aCharacterBody();
  const character = Character.create({
    campaignId: OwningCampaignId.create(campaignId), name: CharacterName.create(body.name),
    identity: A_CHARACTER_IDENTITY, createdBy: playerId, build: toBuildInput(body),
    roll: STANDARD_ARRAY_ROLL, now: TEST_INSTANT,
  });
  character.selfAssignToCreator(TEST_INSTANT);
  await harness.characters.save(character);
  return { campaignId, playerId, gameMasterId, character, beforeSubmission: character.snapshot() };
}

function reviewCommand(
  state: ReviewState,
  action: 'character.submitted' | 'character.accepted',
): CharacterCommand {
  const version = applyReviewAction(state, action);
  return command(state, {
    action, result: toCharacterReviewResult(state.character),
    buildVersion: version ? {
      ordinal: version, contentHash: hashBuildVersion(state.character.snapshot()),
      snapshot: state.character.snapshot(),
    } : null,
  });
}

function applyReviewAction(
  state: ReviewState,
  action: 'character.submitted' | 'character.accepted',
): number | null {
  if (action === 'character.submitted') {
    return state.character.submitForReview(playerContext(state), TEST_INSTANT);
  }
  state.character.acceptReview(gameMasterContext(state), TEST_INSTANT);
  return null;
}

function personalDetailsCommand(state: ReviewState): CharacterCommand {
  state.character.updatePersonalDetails(
    { age: 34, weightKg: 19, description: 'Une cicatrice.' },
    playerContext(state), TEST_INSTANT,
  );
  return command(state, {
    action: 'character.personal-details-updated',
    result: {
      id: state.character.id.value, revision: state.character.revision,
      personalDetails: { age: 34, weightKg: 19, description: 'Une cicatrice.' },
    },
    buildVersion: null,
  });
}

interface MutationResult {
  action: CharacterCommand['action'];
  result: CharacterCommand['result'];
  buildVersion: CharacterCommand['buildVersion'];
}

function command(state: ReviewState, mutation: MutationResult): CharacterCommand {
  const idempotencyKey = randomUUID();
  return {
    campaignId: state.campaignId, principalId: principalFor(state, mutation.action),
    idempotencyKey, intentHash: `${mutation.action}:${idempotencyKey}`,
    occurredAt: TEST_INSTANT, effectiveRole: effectiveRoleFor(mutation.action),
    action: mutation.action, character: state.character, result: mutation.result,
    reason: null, buildVersion: mutation.buildVersion,
  };
}

function principalFor(state: ReviewState, action: CharacterCommand['action']): UserId {
  return action === 'character.accepted' ? state.gameMasterId : state.playerId;
}

function effectiveRoleFor(action: CharacterCommand['action']) {
  return action === 'character.accepted' ? 'gameMaster' as const : 'player' as const;
}

function playerContext(state: ReviewState): CharacterAccessContext {
  return {
    actorId: state.playerId, actorIsGameMaster: false,
    actorIsCampaignOwner: false, creatorIsGameMaster: false,
  };
}

function gameMasterContext(state: ReviewState): CharacterAccessContext {
  return {
    actorId: state.gameMasterId, actorIsGameMaster: true,
    actorIsCampaignOwner: true, creatorIsGameMaster: false,
  };
}

async function expectCounts(
  harness: MongoHarness,
  campaignId: string,
  expected: [number, number, number, number],
): Promise<void> {
  const counts = await Promise.all([
    harness.models.receipts.countDocuments({ campaignId }),
    harness.models.audits.countDocuments({ campaignId }),
    harness.models.outbox.countDocuments({ campaignId }),
    harness.models.versions.countDocuments({ campaignId }),
  ]);
  expect(counts).toEqual(expected);
}

function requiredMongoUri(): string {
  if (!MONGO_URI) throw new Error('MONGODB_INTEGRATION_URI is required');
  return MONGO_URI;
}
