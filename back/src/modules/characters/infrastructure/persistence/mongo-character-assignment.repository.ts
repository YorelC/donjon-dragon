import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  CharacterAssignmentCommandResultSchema,
} from '@donjon-dragon/shared/character-schema';
import type { ClientSession, Connection, Model } from 'mongoose';
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
import type { UserId } from '@kernel/domain/user-id';

import type {
  CharacterAssignmentCommand,
  CharacterAssignmentFact,
  CharacterAssignmentReceipt,
  CharacterAssignmentRepositoryPort,
} from '../../application/ports/character-assignment.repository.port';
import type { Character } from '../../domain/character';
import { CharacterRevisionConflictError } from '../../domain/character.errors';
import { toPersistence, type CharacterDocument } from './character.mapper';
import { CHARACTER_MODEL } from './character.schema';

const SCHEMA_VERSION = 1;
const OWNER_MODULE = 'characters';
const ACCEPTED_STATUS = 'accepted';
const PENDING_STATUS = 'pending';
const AUDIENCE = 'campaign-members';
const SOURCES = ['SF-001', 'SF-002', 'DEC-002', 'SPEC-007'];
const DUPLICATE_KEY_ERROR = 11000;

@Injectable()
export class MongoCharacterAssignmentRepository
  implements CharacterAssignmentRepositoryPort
{
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(CHARACTER_MODEL) private readonly characters: Model<CharacterDocument>,
    @InjectModel(COMMAND_RECEIPT_MODEL)
    private readonly receipts: Model<CommandReceiptDocument>,
    @InjectModel(FUNCTIONAL_AUDIT_ENTRY_MODEL)
    private readonly audits: Model<FunctionalAuditEntryDocument>,
    @InjectModel(OUTBOX_MESSAGE_MODEL)
    private readonly outbox: Model<OutboxMessageDocument>,
  ) {}

  async execute(command: CharacterAssignmentCommand): Promise<CharacterAssignmentReceipt> {
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
  ): Promise<CharacterAssignmentReceipt | null> {
    const receipt = await this.receipts
      .findOne({ principalKey: principalId.value, idempotencyKey })
      .lean<CommandReceiptDocument>();
    if (!receipt) return null;
    const result = CharacterAssignmentCommandResultSchema.safeParse(receipt.result);
    return { intentHash: receipt.intentHash, result: result.success ? result.data : null };
  }

  private async persist(
    command: CharacterAssignmentCommand,
    session: ClientSession,
  ): Promise<CharacterAssignmentReceipt> {
    const receiptId = randomUUID();
    await this.writeReceipt(command, receiptId, session);
    if (command.previousCharacter) await this.save(command.previousCharacter, session);
    await this.save(command.character, session);
    await this.writeAudit(command, receiptId, session);
    await this.writeFacts(command, receiptId, session);
    return { intentHash: command.intentHash, result: command.result };
  }

  private async save(character: Character, session: ClientSession): Promise<void> {
    const result = await this.characters.replaceOne(
      { id: character.id.value, revision: character.revision - 1 },
      toPersistence(character),
      { session },
    );
    if (result.matchedCount !== 1) throw new CharacterRevisionConflictError();
  }

  private async writeReceipt(
    command: CharacterAssignmentCommand,
    receiptId: string,
    session: ClientSession,
  ): Promise<void> {
    await this.receipts.create([receiptDocument(command, receiptId)], { session });
  }

  private async writeAudit(
    command: CharacterAssignmentCommand,
    receiptId: string,
    session: ClientSession,
  ): Promise<void> {
    await this.audits.create([auditDocument(command, receiptId)], { session });
  }

  private async writeFacts(
    command: CharacterAssignmentCommand,
    receiptId: string,
    session: ClientSession,
  ): Promise<void> {
    const documents = command.facts.map((fact, index) =>
      outboxDocument(command, fact, receiptId, index),
    );
    await this.outbox.create(documents, { session, ordered: true });
  }

  private async recover(
    command: CharacterAssignmentCommand,
    error: unknown,
  ): Promise<CharacterAssignmentReceipt> {
    if (!isDuplicateKey(error)) throw error;
    const receipt = await this.findReceipt(command.principalId, command.idempotencyKey);
    if (receipt) return receipt;
    throw error;
  }
}

function receiptDocument(
  command: CharacterAssignmentCommand,
  receiptId: string,
): CommandReceiptDocument {
  return {
    _id: receiptId, schemaVersion: SCHEMA_VERSION,
    principalKey: command.principalId.value, idempotencyKey: command.idempotencyKey,
    ownerModule: OWNER_MODULE, intentionType: command.facts.at(-1) ?? 'character.unassigned',
    intentHash: command.intentHash, status: ACCEPTED_STATUS, result: command.result,
    campaignId: command.campaignId, aggregateIds: aggregateIds(command), randomResults: [],
    createdAt: command.occurredAt, updatedAt: command.occurredAt,
  };
}

function auditDocument(
  command: CharacterAssignmentCommand,
  receiptId: string,
): FunctionalAuditEntryDocument {
  return {
    _id: randomUUID(), schemaVersion: SCHEMA_VERSION, ownerModule: OWNER_MODULE,
    campaignId: command.campaignId, commandReceiptId: receiptId,
    actorKey: command.principalId.value, effectiveRole: command.effectiveRole,
    action: command.facts.at(-1) ?? 'character.unassigned',
    aggregateId: command.character.id.value,
    revisionBefore: command.character.revision - 1,
    revisionAfter: command.character.revision, reasons: [], sources: SOURCES,
    audiences: [AUDIENCE], occurredAt: command.occurredAt,
  };
}

function outboxDocument(
  command: CharacterAssignmentCommand,
  factType: CharacterAssignmentFact,
  receiptId: string,
  index: number,
): OutboxMessageDocument {
  const aggregate = factAggregate(command, factType, index);
  return {
    _id: randomUUID(), schemaVersion: SCHEMA_VERSION, ownerModule: OWNER_MODULE,
    campaignId: command.campaignId, causationId: receiptId,
    aggregateId: aggregate.id.value, aggregateRevision: aggregate.revision,
    factType, fact: { campaignId: command.campaignId, characterId: aggregate.id.value },
    audiencePolicy: AUDIENCE, status: PENDING_STATUS,
    availableAt: command.occurredAt, leaseUntil: null,
    createdAt: command.occurredAt, updatedAt: command.occurredAt,
  };
}

function factAggregate(
  command: CharacterAssignmentCommand,
  factType: CharacterAssignmentFact,
  index: number,
): Character {
  if (factType === 'character.unassigned' && index === 0 && command.previousCharacter) {
    return command.previousCharacter;
  }
  return command.character;
}

function aggregateIds(command: CharacterAssignmentCommand): string[] {
  const previous = command.previousCharacter?.id.value;
  return previous ? [previous, command.character.id.value] : [command.character.id.value];
}

function isDuplicateKey(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'code' in error && error.code === DUPLICATE_KEY_ERROR;
}
