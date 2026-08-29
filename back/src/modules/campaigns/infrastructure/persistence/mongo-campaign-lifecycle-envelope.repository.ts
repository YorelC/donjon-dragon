import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CampaignCommandResultSchema,
  type CampaignCommandResult,
} from '@donjon-dragon/shared/campaign-schema';
import type { ClientSession, Model } from 'mongoose';
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
import { CAMPAIGNS_OWNER_MODULE } from '../../application/realtime-projection';

import type {
  CampaignLifecycleCommand,
  CampaignLifecycleReceipt,
} from '../../application/ports/campaign-lifecycle.repository.port';

const SCHEMA_VERSION = 1;
const OWNER_MODULE = CAMPAIGNS_OWNER_MODULE;
const ACCEPTED_STATUS = 'accepted';
const AUDIENCE = OUTBOX_AUDIENCE_POLICY.campaignMembers;
const SOURCES = ['SF-001', 'DEC-002', 'SPEC-006'];

interface LifecycleEnvelopeWrite {
  command: CampaignLifecycleCommand;
  aggregateIds: string[];
  receiptId: string;
}

@Injectable()
export class MongoCampaignLifecycleEnvelopeRepository {
  constructor(
    @InjectModel(COMMAND_RECEIPT_MODEL)
    private readonly receipts: Model<CommandReceiptDocument>,
    @InjectModel(FUNCTIONAL_AUDIT_ENTRY_MODEL)
    private readonly audits: Model<FunctionalAuditEntryDocument>,
    @InjectModel(OUTBOX_MESSAGE_MODEL)
    private readonly outbox: Model<OutboxMessageDocument>,
  ) {}

  async findReceipt(
    principalKey: string,
    idempotencyKey: string,
  ): Promise<CampaignLifecycleReceipt | null> {
    const receipt = await this.receipts
      .findOne({ principalKey, idempotencyKey })
      .lean<CommandReceiptDocument>();
    if (!receipt) return null;
    const result = CampaignCommandResultSchema.safeParse(receipt.result);
    return { intentHash: receipt.intentHash, result: result.success ? result.data : null };
  }

  async write(
    command: CampaignLifecycleCommand,
    participantIds: string[],
    session: ClientSession,
  ): Promise<void> {
    const aggregateIds = [command.campaign.id.value, ...participantIds];
    const write = { command, aggregateIds, receiptId: randomUUID() };
    await this.receipts.create([receiptDocument(write)], { session });
    await this.audits.create([auditDocument(write)], { session });
    await this.outbox.create([outboxDocument(write)], { session });
  }
}

function receiptDocument(write: LifecycleEnvelopeWrite): CommandReceiptDocument {
  const { command, aggregateIds, receiptId } = write;
  return {
    _id: receiptId,
    schemaVersion: SCHEMA_VERSION,
    principalKey: command.principalId.value,
    idempotencyKey: command.idempotencyKey,
    ownerModule: OWNER_MODULE,
    intentionType: command.factType,
    intentHash: command.intentHash,
    status: ACCEPTED_STATUS,
    result: command.result,
    campaignId: command.campaign.id.value,
    aggregateIds,
    randomResults: [],
    createdAt: command.occurredAt,
    updatedAt: command.occurredAt,
  };
}

function auditDocument(write: LifecycleEnvelopeWrite): FunctionalAuditEntryDocument {
  const { command, receiptId } = write;
  return {
    _id: randomUUID(),
    schemaVersion: SCHEMA_VERSION,
    ownerModule: OWNER_MODULE,
    campaignId: command.campaign.id.value,
    commandReceiptId: receiptId,
    actorKey: command.principalId.value,
    effectiveRole: command.effectiveRole,
    action: command.factType,
    aggregateId: command.campaign.id.value,
    revisionBefore: command.campaign.revision - 1,
    revisionAfter: command.campaign.revision,
    reasons: [],
    sources: SOURCES,
    audiences: [AUDIENCE],
    occurredAt: command.occurredAt,
  };
}

function outboxDocument(write: LifecycleEnvelopeWrite): OutboxMessageDocument {
  const { command, receiptId } = write;
  return createOutboxMessage({
    ownerModule: OWNER_MODULE,
    campaignId: command.campaign.id.value,
    causationId: receiptId,
    aggregateId: command.campaign.id.value,
    aggregateRevision: command.campaign.revision,
    factType: command.factType,
    fact: outboxFact(command.result),
    audience: { policy: AUDIENCE },
    deliveryChannel: OUTBOX_DELIVERY_CHANNEL.realtime,
    occurredAt: command.occurredAt,
  });
}

function outboxFact(result: CampaignCommandResult): Record<string, unknown> {
  return { campaignId: result.campaignId, revision: result.revision };
}
