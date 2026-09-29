import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
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
import { OUTBOX_AUDIENCE_POLICY } from '@kernel/infrastructure/outbox-message.contract';

import { CHARACTERS_OWNER_MODULE } from '../../application/realtime-projection';
import type {
  JournalCommand,
  JournalCommandReceipt,
  JournalCommandRepositoryPort,
} from '../../application/ports/journal-command.repository.port';
import { JOURNAL_REVISION_STEP, type JournalChapter } from '../../domain/journal-chapter';
import { JournalChapterModifiedElsewhereError } from '../../domain/journal-chapter.errors';
import { toJournalChapterDocument, type JournalChapterDocument } from './journal-chapter.mapper';
import { JOURNAL_CHAPTER_MODEL } from './journal-chapter.schema';
import { ENVELOPE_SCHEMA_VERSION, ACCEPTED_STATUS, isDuplicateKey } from '@kernel/infrastructure/command-envelope';

const AUDIENCE = OUTBOX_AUDIENCE_POLICY.campaignGameMasters;
const SOURCES = ['SF-002', 'DEC-015', 'DEC-016', 'SPEC-013'];
const SINGLE_MATCH = 1;

type JournalWrite = (session: ClientSession) => Promise<void>;

/**
 * Chaque écriture du journal part avec son reçu et son audit, dans une même
 * transaction. Aucun message d'outbox : le journal n'est pas diffusé en temps
 * réel (spec 013).
 */
@Injectable()
export class MongoJournalCommandRepository implements JournalCommandRepositoryPort {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(JOURNAL_CHAPTER_MODEL) private readonly chapters: Model<JournalChapterDocument>,
    @InjectModel(COMMAND_RECEIPT_MODEL) private readonly receipts: Model<CommandReceiptDocument>,
    @InjectModel(FUNCTIONAL_AUDIT_ENTRY_MODEL)
    private readonly audits: Model<FunctionalAuditEntryDocument>,
  ) {}

  async findReceipt(
    principalId: UserId,
    idempotencyKey: string,
  ): Promise<JournalCommandReceipt | null> {
    const receipt = await this.receipts
      .findOne({ principalKey: principalId.value, idempotencyKey })
      .lean<CommandReceiptDocument>();
    return receipt ? { intentHash: receipt.intentHash, result: receipt.result } : null;
  }

  create(command: JournalCommand, chapter: JournalChapter): Promise<JournalCommandReceipt> {
    return this.run(command, async (session) => {
      await this.chapters.create([toJournalChapterDocument(chapter)], { session });
    });
  }

  rewrite(command: JournalCommand, chapter: JournalChapter): Promise<JournalCommandReceipt> {
    return this.run(command, async (session) => {
      const replaced = await this.chapters.replaceOne(
        { id: chapter.id.value, revision: chapter.revision - JOURNAL_REVISION_STEP },
        toJournalChapterDocument(chapter),
        { session },
      );
      if (replaced.matchedCount !== SINGLE_MATCH) throw new JournalChapterModifiedElsewhereError();
    });
  }

  remove(command: JournalCommand, chapter: JournalChapter): Promise<JournalCommandReceipt> {
    return this.run(command, async (session) => {
      await this.chapters.deleteOne({ id: chapter.id.value }, { session });
    });
  }

  reorder(
    command: JournalCommand,
    chapters: readonly JournalChapter[],
  ): Promise<JournalCommandReceipt> {
    return this.run(command, async (session) => {
      // Mongo refuse un lot vide : un journal sans chapitre n'a rien à ranger.
      if (chapters.length === 0) return;
      await this.chapters.bulkWrite(chapters.map(positionUpdate), { session });
    });
  }

  private async run(command: JournalCommand, write: JournalWrite): Promise<JournalCommandReceipt> {
    const existing = await this.findReceipt(command.principalId, command.idempotencyKey);
    if (existing) return existing;
    try {
      return await this.connection.transaction((session) => this.persist(command, write, session));
    } catch (error) {
      return this.recover(command, error);
    }
  }

  private async persist(
    command: JournalCommand,
    write: JournalWrite,
    session: ClientSession,
  ): Promise<JournalCommandReceipt> {
    const receiptId = randomUUID();
    await this.receipts.create([receiptDocument(command, receiptId)], { session });
    await write(session);
    await this.audits.create([auditDocument(command, receiptId)], { session });
    return { intentHash: command.intentHash, result: command.result };
  }

  // Deux envois simultanés de la même clé : l'index unique en arrête un, et c'est
  // le reçu déjà écrit qui fait foi.
  private async recover(command: JournalCommand, error: unknown): Promise<JournalCommandReceipt> {
    if (!isDuplicateKey(error)) throw error;
    const receipt = await this.findReceipt(command.principalId, command.idempotencyKey);
    if (receipt) return receipt;
    throw error;
  }
}

function positionUpdate(chapter: JournalChapter) {
  return {
    updateOne: {
      filter: { id: chapter.id.value },
      update: { $set: { position: chapter.position } },
    },
  };
}

function receiptDocument(command: JournalCommand, receiptId: string): CommandReceiptDocument {
  return {
    _id: receiptId, schemaVersion: ENVELOPE_SCHEMA_VERSION,
    principalKey: command.principalId.value, idempotencyKey: command.idempotencyKey,
    ownerModule: CHARACTERS_OWNER_MODULE, intentionType: command.action,
    intentHash: command.intentHash, status: ACCEPTED_STATUS, result: command.result,
    campaignId: command.campaignId, aggregateIds: [command.aggregateId], randomResults: [],
    createdAt: command.occurredAt, updatedAt: command.occurredAt,
  };
}

function auditDocument(
  command: JournalCommand,
  receiptId: string,
): FunctionalAuditEntryDocument {
  return {
    _id: randomUUID(), schemaVersion: ENVELOPE_SCHEMA_VERSION, ownerModule: CHARACTERS_OWNER_MODULE,
    campaignId: command.campaignId, commandReceiptId: receiptId,
    actorKey: command.principalId.value, effectiveRole: command.effectiveRole,
    action: command.action, aggregateId: command.aggregateId,
    revisionBefore: command.revisionBefore, revisionAfter: command.revisionAfter,
    reasons: [], sources: SOURCES, audiences: [AUDIENCE], occurredAt: command.occurredAt,
  };
}
