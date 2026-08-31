import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { IssuedAbilityRollSchema } from '@donjon-dragon/shared/character-schema';
import type { ClientSession, Connection, Model } from 'mongoose';
import {
  COMMAND_RECEIPT_MODEL,
  type CommandReceiptDocument,
} from '@kernel/infrastructure/command-receipt.schema';
import {
  FUNCTIONAL_AUDIT_ENTRY_MODEL,
  type FunctionalAuditEntryDocument,
} from '@kernel/infrastructure/functional-audit-entry.schema';
import { OUTBOX_AUDIENCE_POLICY } from '@kernel/infrastructure/outbox-message.contract';
import type { UserId } from '@kernel/domain/user-id';

import type {
  AbilityRollIssueCommand,
  AbilityRollReceipt,
  AbilityRollRepositoryPort,
  IssuedAbilityRoll,
} from '../../application/ports/ability-roll.repository.port';
import { CHARACTERS_OWNER_MODULE } from '../../application/realtime-projection';
import type { AbilityRollSnapshot } from '../../domain/ability-roll';
import { ABILITY_ROLL_INTENTION, ABILITY_ROLL_STATUS } from '../../application/ability-roll-receipt';
import { AbilityRollCommandConflictError } from '../../domain/character.errors';

const SCHEMA_VERSION = 1;
const SOURCES = ['SF-002', 'B01-CAR-002', 'DEC-005', 'SPEC-009'];
const PLAYER_ROLE = 'player';
const DUPLICATE_KEY_ERROR = 11000;

/**
 * Un tirage émis est un reçu de commande du kernel : même idempotence, même
 * index unique, même rejeu. Son `status` porte en plus sa consommation, que la
 * création bascule dans sa propre transaction.
 */
@Injectable()
export class MongoAbilityRollRepository implements AbilityRollRepositoryPort {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(COMMAND_RECEIPT_MODEL)
    private readonly receipts: Model<CommandReceiptDocument>,
    @InjectModel(FUNCTIONAL_AUDIT_ENTRY_MODEL)
    private readonly audits: Model<FunctionalAuditEntryDocument>,
  ) {}

  async issue(command: AbilityRollIssueCommand): Promise<IssuedAbilityRoll> {
    try {
      return await this.connection.transaction((session) => this.persist(command, session));
    } catch (error) {
      return this.recover(command, error);
    }
  }

  async findReceipt(
    principalId: UserId,
    idempotencyKey: string,
  ): Promise<AbilityRollReceipt | null> {
    const receipt = await this.receipts
      .findOne({ principalKey: principalId.value, idempotencyKey })
      .lean<CommandReceiptDocument>();
    if (!receipt) return null;

    const result = IssuedAbilityRollSchema.safeParse(receipt.result);
    return { intentHash: receipt.intentHash, result: result.success ? result.data : null };
  }

  /**
   * Deux demandes simultanees sous la meme cle : l'index unique du recu en
   * arrete une, et c'est le recu deja ecrit qui fait foi. Sans ca, l'appelant
   * verrait une erreur Mongo brute.
   */
  private async recover(
    command: AbilityRollIssueCommand,
    error: unknown,
  ): Promise<IssuedAbilityRoll> {
    if (!isDuplicateKey(error)) throw error;
    const receipt = await this.findReceipt(command.principalId, command.idempotencyKey);
    if (receipt?.result && receipt.intentHash === command.intentHash) return receipt.result;
    throw new AbilityRollCommandConflictError();
  }

  async findIssued(
    rollId: string,
    principalId: UserId,
    campaignId: string,
  ): Promise<AbilityRollSnapshot | null> {
    const receipt = await this.receipts
      .findOne({
        _id: rollId,
        principalKey: principalId.value,
        campaignId,
        intentionType: ABILITY_ROLL_INTENTION,
        status: ABILITY_ROLL_STATUS.issued,
      })
      .lean<CommandReceiptDocument>();

    return receipt ? snapshotOf(receipt) : null;
  }

  private async persist(
    command: AbilityRollIssueCommand,
    session: ClientSession,
  ): Promise<IssuedAbilityRoll> {
    const rollId = randomUUID();
    const result = issuedRollOf(command, rollId);
    await this.receipts.create([receiptDocument(command, result)], { session });
    await this.audits.create([auditDocument(command, rollId)], { session });
    return result;
  }
}

function issuedRollOf(
  command: AbilityRollIssueCommand,
  rollId: string,
): IssuedAbilityRoll {
  return {
    rollId,
    dice: command.roll.dice.map((faces) => [...faces]),
    totals: [...command.totals],
  };
}

function receiptDocument(
  command: AbilityRollIssueCommand,
  result: IssuedAbilityRoll,
): CommandReceiptDocument {
  return {
    _id: result.rollId, schemaVersion: SCHEMA_VERSION,
    principalKey: command.principalId.value, idempotencyKey: command.idempotencyKey,
    ownerModule: CHARACTERS_OWNER_MODULE, intentionType: ABILITY_ROLL_INTENTION,
    intentHash: command.intentHash,
    status: ABILITY_ROLL_STATUS.issued, result,
    campaignId: command.campaignId, aggregateIds: [],
    randomResults: [command.roll],
    createdAt: command.occurredAt, updatedAt: command.occurredAt,
  };
}

function auditDocument(
  command: AbilityRollIssueCommand,
  rollId: string,
): FunctionalAuditEntryDocument {
  return {
    _id: randomUUID(), schemaVersion: SCHEMA_VERSION,
    ownerModule: CHARACTERS_OWNER_MODULE, campaignId: command.campaignId,
    commandReceiptId: rollId, actorKey: command.principalId.value,
    effectiveRole: PLAYER_ROLE, action: ABILITY_ROLL_INTENTION,
    aggregateId: rollId, revisionBefore: null, revisionAfter: 0,
    reasons: [], sources: SOURCES,
    audiences: [OUTBOX_AUDIENCE_POLICY.targetUser], occurredAt: command.occurredAt,
  };
}

/** Les dés font foi, pas les totaux : le domaine les recalcule de toute façon. */
function snapshotOf(receipt: CommandReceiptDocument): AbilityRollSnapshot | null {
  const result = IssuedAbilityRollSchema.safeParse(receipt.result);
  return result.success ? { dice: result.data.dice } : null;
}

function isDuplicateKey(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'code' in error
    && error.code === DUPLICATE_KEY_ERROR;
}
