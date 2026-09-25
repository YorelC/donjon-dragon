import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  CharacterReviewCommandResultSchema,
  CharacterSchema as CharacterDtoSchema,
} from '@donjon-dragon/shared/character-schema';
import type { ClientSession, Connection, Model } from 'mongoose';
import type { UserId } from '@kernel/domain/user-id';
import {
  COMMAND_RECEIPT_MODEL,
  type CommandReceiptDocument,
} from '@kernel/infrastructure/command-receipt.schema';
import {
  FUNCTIONAL_AUDIT_ENTRY_MODEL,
  type FunctionalAuditEntryDocument,
} from '@kernel/infrastructure/functional-audit-entry.schema';
import {
  OUTBOX_MESSAGE_MODEL,
  type OutboxMessageDocument,
} from '@kernel/infrastructure/outbox-message.schema';
import {
  OUTBOX_AUDIENCE_POLICY,
  OUTBOX_DELIVERY_CHANNEL,
} from '@kernel/infrastructure/outbox-message.contract';
import { createOutboxMessage } from '@kernel/infrastructure/outbox-message.factory';

import { CHARACTERS_OWNER_MODULE } from '../../application/realtime-projection';
import type {
  CharacterCommand,
  CharacterCommandReceipt,
  CharacterCommandRepositoryPort,
  CharacterCommandResult,
} from '../../application/ports/character-command.repository.port';
import { CharacterRevisionConflictError } from '../../domain/character.errors';
import { toPersistence, type CharacterDocument } from './character.mapper';
import { CHARACTER_MODEL } from './character.schema';
import {
  CHARACTER_BUILD_VERSION_MODEL,
  type CharacterBuildVersionDocument,
} from './character-build-version.schema';

const SCHEMA_VERSION = 1;
const OWNER_MODULE = CHARACTERS_OWNER_MODULE;
const ACCEPTED_STATUS = 'accepted';
const AUDIENCE = OUTBOX_AUDIENCE_POLICY.campaignMembers;
const SOURCES = ['SF-002', 'DEC-003', 'DEC-016', 'SPEC-009'];
const DUPLICATE_KEY_ERROR = 11000;

@Injectable()
export class MongoCharacterCommandRepository implements CharacterCommandRepositoryPort {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(CHARACTER_MODEL) private readonly characters: Model<CharacterDocument>,
    @InjectModel(CHARACTER_BUILD_VERSION_MODEL)
    private readonly versions: Model<CharacterBuildVersionDocument>,
    @InjectModel(COMMAND_RECEIPT_MODEL) private readonly receipts: Model<CommandReceiptDocument>,
    @InjectModel(FUNCTIONAL_AUDIT_ENTRY_MODEL)
    private readonly audits: Model<FunctionalAuditEntryDocument>,
    @InjectModel(OUTBOX_MESSAGE_MODEL) private readonly outbox: Model<OutboxMessageDocument>,
  ) {}

  async execute(command: CharacterCommand): Promise<CharacterCommandReceipt> {
    const existing = await this.findReceipt(command.principalId, command.idempotencyKey);
    if (existing) return existing;
    try {
      return await this.connection.transaction((session) => this.persist(command, session));
    } catch (error) {
      return this.recover(command, error);
    }
  }

  async findReceipt(
    principalId: UserId,
    idempotencyKey: string,
  ): Promise<CharacterCommandReceipt | null> {
    const receipt = await this.receipts
      .findOne({ principalKey: principalId.value, idempotencyKey })
      .lean<CommandReceiptDocument>();
    if (!receipt) return null;
    return { intentHash: receipt.intentHash, result: parseResult(receipt.result) };
  }

  private async persist(
    command: CharacterCommand,
    session: ClientSession,
  ): Promise<CharacterCommandReceipt> {
    const receiptId = randomUUID();
    await this.receipts.create([receiptDocument(command, receiptId)], { session });
    await this.writeVersion(command, session);
    await this.save(command, session);
    await this.audits.create([auditDocument(command, receiptId)], { session });
    await this.outbox.create([outboxDocument(command, receiptId)], { session });
    return { intentHash: command.intentHash, result: command.result };
  }

  private async writeVersion(command: CharacterCommand, session: ClientSession): Promise<void> {
    if (!command.buildVersion) return;
    await this.versions.create([versionDocument(command)], { session });
  }

  private async save(command: CharacterCommand, session: ClientSession): Promise<void> {
    const character = command.character;
    const result = await this.characters.replaceOne(
      { id: character.id.value, revision: character.revision - 1 },
      toPersistence(character),
      { session },
    );
    if (result.matchedCount !== 1) throw new CharacterRevisionConflictError();
  }

  private async recover(
    command: CharacterCommand,
    error: unknown,
  ): Promise<CharacterCommandReceipt> {
    if (!isDuplicateKey(error)) throw error;
    const receipt = await this.findReceipt(command.principalId, command.idempotencyKey);
    if (receipt) return receipt;
    throw error;
  }
}

function receiptDocument(command: CharacterCommand, receiptId: string): CommandReceiptDocument {
  return {
    _id: receiptId, schemaVersion: SCHEMA_VERSION,
    principalKey: command.principalId.value, idempotencyKey: command.idempotencyKey,
    ownerModule: OWNER_MODULE, intentionType: command.action, intentHash: command.intentHash,
    status: ACCEPTED_STATUS, result: command.result, campaignId: command.campaignId,
    aggregateIds: [command.character.id.value], randomResults: [],
    createdAt: command.occurredAt, updatedAt: command.occurredAt,
  };
}

function versionDocument(command: CharacterCommand): CharacterBuildVersionDocument {
  const version = command.buildVersion;
  if (!version) throw new Error('Build version required');
  return {
    _id: randomUUID(), schemaVersion: SCHEMA_VERSION,
    characterId: command.character.id.value, campaignId: command.campaignId,
    ordinal: version.ordinal, contentHash: version.contentHash, snapshot: version.snapshot,
    createdBy: command.principalId.value, createdAt: command.occurredAt,
  };
}

function auditDocument(
  command: CharacterCommand,
  receiptId: string,
): FunctionalAuditEntryDocument {
  return {
    _id: randomUUID(), schemaVersion: SCHEMA_VERSION, ownerModule: OWNER_MODULE,
    campaignId: command.campaignId, commandReceiptId: receiptId,
    actorKey: command.principalId.value, effectiveRole: command.effectiveRole,
    action: command.action, aggregateId: command.character.id.value,
    revisionBefore: command.character.revision - 1, revisionAfter: command.character.revision,
    reasons: command.reason ? [command.reason] : [], sources: SOURCES,
    audiences: [AUDIENCE], occurredAt: command.occurredAt,
  };
}

function outboxDocument(command: CharacterCommand, receiptId: string): OutboxMessageDocument {
  return createOutboxMessage({
    ownerModule: OWNER_MODULE, campaignId: command.campaignId, causationId: receiptId,
    aggregateId: command.character.id.value, aggregateRevision: command.character.revision,
    factType: command.action,
    fact: { campaignId: command.campaignId, characterId: command.character.id.value },
    audience: { policy: AUDIENCE }, deliveryChannel: OUTBOX_DELIVERY_CHANNEL.realtime,
    occurredAt: command.occurredAt,
  });
}

function parseResult(value: unknown): CharacterCommandResult | null {
  const review = CharacterReviewCommandResultSchema.safeParse(value);
  if (review.success) return review.data;
  const character = CharacterDtoSchema.safeParse(value);
  return character.success ? character.data : null;
}

function isDuplicateKey(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'code' in error && error.code === DUPLICATE_KEY_ERROR;
}
