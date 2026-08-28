import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
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

import type {
  CampaignCreationCommand,
  CampaignCreationReceipt,
  CampaignCreationResult,
} from '../../application/ports/campaign.repository.port';

const SCHEMA_VERSION = 1;
const OWNER_MODULE = 'campaigns';
const INTENTION_TYPE = 'campaign.create';
const ACCEPTED_STATUS = 'accepted';
const CREATED_FACT = 'campaign.created';
const CAMPAIGN_MEMBERS_AUDIENCE = OUTBOX_AUDIENCE_POLICY.campaignMembers;
const CAMPAIGN_REQUIREMENT = 'SF-001';
const STRING_RESULT_FIELDS = ['campaignId', 'name', 'ownerUserId'] as const;
const NUMBER_RESULT_FIELDS = ['gameMasterCount', 'playerCount'] as const;

interface CampaignEnvelopeWrite {
  command: CampaignCreationCommand;
  receiptId: string;
  result: CampaignCreationResult;
}

@Injectable()
export class MongoCampaignEnvelopeRepository {
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
  ): Promise<CampaignCreationReceipt | null> {
    const receipt = await this.receipts
      .findOne({ principalKey, idempotencyKey })
      .lean<CommandReceiptDocument>();
    if (!receipt) return null;

    return { intentHash: receipt.intentHash, result: creationResult(receipt.result) };
  }

  async write(
    command: CampaignCreationCommand,
    result: CampaignCreationResult,
    session: ClientSession,
  ): Promise<void> {
    const envelope = { command, result, receiptId: randomUUID() };
    await this.receipts.create([receiptDocument(envelope)], { session });
    await this.audits.create([auditDocument(envelope)], { session });
    await this.outbox.create([outboxDocument(envelope)], { session });
  }
}

function receiptDocument(write: CampaignEnvelopeWrite): CommandReceiptDocument {
  const { command, receiptId, result } = write;
  return {
    _id: receiptId,
    schemaVersion: SCHEMA_VERSION,
    principalKey: command.principalId.value,
    idempotencyKey: command.idempotencyKey,
    ownerModule: OWNER_MODULE,
    intentionType: INTENTION_TYPE,
    intentHash: command.intentHash,
    status: ACCEPTED_STATUS,
    result,
    campaignId: result.campaignId,
    aggregateIds: [result.campaignId],
    randomResults: [],
    createdAt: command.occurredAt,
    updatedAt: command.occurredAt,
  };
}

function auditDocument(write: CampaignEnvelopeWrite): FunctionalAuditEntryDocument {
  const { command, receiptId, result } = write;
  return {
    _id: randomUUID(),
    schemaVersion: SCHEMA_VERSION,
    ownerModule: OWNER_MODULE,
    campaignId: result.campaignId,
    commandReceiptId: receiptId,
    actorKey: command.principalId.value,
    effectiveRole: null,
    action: CREATED_FACT,
    aggregateId: result.campaignId,
    revisionBefore: null,
    revisionAfter: command.campaign.revision,
    reasons: [],
    sources: [CAMPAIGN_REQUIREMENT],
    audiences: [CAMPAIGN_MEMBERS_AUDIENCE],
    occurredAt: command.occurredAt,
  };
}

function outboxDocument(write: CampaignEnvelopeWrite): OutboxMessageDocument {
  const { command, receiptId, result } = write;
  return createOutboxMessage({
    ownerModule: OWNER_MODULE,
    campaignId: result.campaignId,
    causationId: receiptId,
    aggregateId: result.campaignId,
    aggregateRevision: command.campaign.revision,
    factType: CREATED_FACT,
    fact: { campaignId: result.campaignId, ownerUserId: result.ownerUserId },
    audience: { policy: CAMPAIGN_MEMBERS_AUDIENCE },
    deliveryChannel: OUTBOX_DELIVERY_CHANNEL.realtime,
    occurredAt: command.occurredAt,
  });
}

function creationResult(value: unknown): CampaignCreationResult {
  if (!isCreationResult(value)) throw new Error('Invalid campaign creation receipt');
  return value;
}

function isCreationResult(value: unknown): value is CampaignCreationResult {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return hasStringFields(candidate) && hasNumberFields(candidate);
}

function hasStringFields(candidate: Record<string, unknown>): boolean {
  return STRING_RESULT_FIELDS.every((field) => typeof candidate[field] === 'string');
}

function hasNumberFields(candidate: Record<string, unknown>): boolean {
  return NUMBER_RESULT_FIELDS.every((field) => typeof candidate[field] === 'number');
}
