import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { CharacterSchema as CharacterDtoSchema } from '@donjon-dragon/shared/character-schema';
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
import {
  OUTBOX_AUDIENCE_POLICY,
  OUTBOX_DELIVERY_CHANNEL,
} from '@kernel/infrastructure/outbox-message.contract';
import { createOutboxMessage } from '@kernel/infrastructure/outbox-message.factory';
import type { UserId } from '@kernel/domain/user-id';

import type {
  CharacterCreationCommand,
  CharacterCreationReceipt,
  CharacterCreationRepositoryPort,
} from '../../application/ports/character-creation.repository.port';
import {
  CHARACTER_FACT,
  CHARACTERS_OWNER_MODULE,
} from '../../application/realtime-projection';
import {
  AbilityRollAlreadyUsedError,
  PlayerAlreadyHasCharacterError,
} from '../../domain/character.errors';
import { ABILITY_ROLL_INTENTION, ABILITY_ROLL_STATUS } from '../../application/ability-roll-receipt';
import { toPersistence, type CharacterDocument } from './character.mapper';
import { CHARACTER_MODEL } from './character.schema';

const SCHEMA_VERSION = 1;
const ACCEPTED_STATUS = 'accepted';
const DUPLICATE_KEY_ERROR = 11000;
const SOURCES = ['SF-002', 'B01', 'DEC-015', 'DEC-016', 'SPEC-007', 'SPEC-009'];

@Injectable()
export class MongoCharacterCreationRepository implements CharacterCreationRepositoryPort {
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

  async execute(command: CharacterCreationCommand): Promise<CharacterCreationReceipt> {
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
  ): Promise<CharacterCreationReceipt | null> {
    const receipt = await this.receipts
      .findOne({ principalKey: principalId.value, idempotencyKey })
      .lean<CommandReceiptDocument>();
    if (!receipt) return null;
    const result = CharacterDtoSchema.safeParse(receipt.result);
    return { intentHash: receipt.intentHash, result: result.success ? result.data : null };
  }

  private async persist(
    command: CharacterCreationCommand,
    session: ClientSession,
  ): Promise<CharacterCreationReceipt> {
    const receiptId = randomUUID();
    await this.consumeAbilityRoll(command, session);
    await this.receipts.create([receiptDocument(command, receiptId)], { session });
    await this.characters.create([toPersistence(command.character)], { session });
    await this.audits.create([auditDocument(command, receiptId)], { session });
    await this.outbox.create([outboxDocument(command, receiptId)], { session });
    return { intentHash: command.intentHash, result: command.result };
  }

  /**
   * Un tirage ne sert qu'une fois. La bascule est conditionnelle et dans la
   * même session que le personnage : deux créations concurrentes ne peuvent pas
   * s'appuyer sur le même tirage.
   */
  private async consumeAbilityRoll(
    command: CharacterCreationCommand,
    session: ClientSession,
  ): Promise<void> {
    if (!command.abilityRollId) return;
    const consumed = await this.receipts.updateOne(
      {
        _id: command.abilityRollId,
        principalKey: command.principalId.value,
        intentionType: ABILITY_ROLL_INTENTION,
        status: ABILITY_ROLL_STATUS.issued,
      },
      { $set: { status: ABILITY_ROLL_STATUS.consumed, updatedAt: command.occurredAt } },
      { session },
    );
    if (consumed.modifiedCount !== 1) throw new AbilityRollAlreadyUsedError();
  }

  private async recover(
    command: CharacterCreationCommand,
    error: unknown,
  ): Promise<CharacterCreationReceipt> {
    if (!isDuplicateKey(error)) throw error;
    const receipt = await this.findReceipt(command.principalId, command.idempotencyKey);
    if (receipt) return receipt;
    throw new PlayerAlreadyHasCharacterError();
  }
}

function receiptDocument(
  command: CharacterCreationCommand,
  receiptId: string,
): CommandReceiptDocument {
  return {
    _id: receiptId, schemaVersion: SCHEMA_VERSION,
    principalKey: command.principalId.value, idempotencyKey: command.idempotencyKey,
    ownerModule: CHARACTERS_OWNER_MODULE, intentionType: CHARACTER_FACT.created,
    intentHash: command.intentHash, status: ACCEPTED_STATUS, result: command.result,
    campaignId: command.campaignId, aggregateIds: [command.character.id.value],
    randomResults: command.character.abilityRoll ? [command.character.abilityRoll.snapshot()] : [],
    createdAt: command.occurredAt, updatedAt: command.occurredAt,
  };
}

function auditDocument(
  command: CharacterCreationCommand,
  receiptId: string,
): FunctionalAuditEntryDocument {
  return {
    _id: randomUUID(), schemaVersion: SCHEMA_VERSION,
    ownerModule: CHARACTERS_OWNER_MODULE, campaignId: command.campaignId,
    commandReceiptId: receiptId, actorKey: command.principalId.value,
    effectiveRole: command.effectiveRole, action: CHARACTER_FACT.created,
    aggregateId: command.character.id.value, revisionBefore: null,
    revisionAfter: command.character.revision, reasons: [], sources: SOURCES,
    audiences: [OUTBOX_AUDIENCE_POLICY.campaignMembers], occurredAt: command.occurredAt,
  };
}

function outboxDocument(
  command: CharacterCreationCommand,
  receiptId: string,
): OutboxMessageDocument {
  return createOutboxMessage({
    ownerModule: CHARACTERS_OWNER_MODULE, campaignId: command.campaignId,
    causationId: receiptId, aggregateId: command.character.id.value,
    aggregateRevision: command.character.revision, factType: CHARACTER_FACT.created,
    fact: { campaignId: command.campaignId, characterId: command.character.id.value },
    audience: { policy: OUTBOX_AUDIENCE_POLICY.campaignMembers },
    deliveryChannel: OUTBOX_DELIVERY_CHANNEL.realtime,
    occurredAt: command.occurredAt,
  });
}

function isDuplicateKey(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'code' in error && error.code === DUPLICATE_KEY_ERROR;
}
