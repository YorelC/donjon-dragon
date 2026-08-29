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
  type CampaignOutboxAudience,
  type OutboxDeliveryChannel,
} from '@kernel/infrastructure/outbox-message.contract';
import { createOutboxMessage } from '@kernel/infrastructure/outbox-message.factory';
import {
  CAMPAIGN_FACT,
  CAMPAIGNS_OWNER_MODULE,
  type CampaignFact,
} from '../../application/realtime-projection';

import type {
  CampaignInvitationCommand,
  CampaignInvitationMutationReceipt,
} from '../../application/ports/campaign-invitation.repository.port';

const SCHEMA_VERSION = 1;
const OWNER_MODULE = CAMPAIGNS_OWNER_MODULE;
const ACCEPTED_STATUS = 'accepted';
const SOURCES = ['SF-001', 'SF-006'];

type CampaignAudiencePolicy = CampaignOutboxAudience['policy'];

interface InvitationEnvelopeDescriptor {
  intentionType: string;
  factType: CampaignFact;
  audiencePolicy: CampaignAudiencePolicy;
  aggregateIds: string[];
  revisionBefore: number | null;
}

interface InvitationEnvelopeWrite {
  command: CampaignInvitationCommand;
  descriptor: InvitationEnvelopeDescriptor;
  receiptId: string;
}

interface InvitationEnvelopeRequest {
  command: CampaignInvitationCommand;
  descriptor: InvitationEnvelopeDescriptor;
  includeEmail: boolean;
}

interface DescriptorPolicy {
  intentionType: string;
  factType: CampaignFact;
  audiencePolicy: CampaignAudiencePolicy;
}

interface DescriptorConfiguration extends DescriptorPolicy {
  revisionBefore: number | null;
}

interface OutboxProjection {
  factType: CampaignFact;
  audiencePolicy: CampaignAudiencePolicy;
  deliveryChannel: OutboxDeliveryChannel;
}

@Injectable()
export class MongoCampaignInvitationEnvelopeRepository {
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
  ): Promise<CampaignInvitationMutationReceipt | null> {
    const receipt = await this.receipts
      .findOne({ principalKey, idempotencyKey })
      .lean<CommandReceiptDocument>();
    return receipt ? { intentHash: receipt.intentHash } : null;
  }

  writeCreation(
    command: CampaignInvitationCommand,
    session: ClientSession,
  ): Promise<void> {
    return this.write({ command, descriptor: creationDescriptor(command), includeEmail: true }, session);
  }

  writeAcceptance(
    command: CampaignInvitationCommand,
    session: ClientSession,
  ): Promise<void> {
    return this.write({ command, descriptor: acceptanceDescriptor(command), includeEmail: false }, session);
  }

  writeRefusal(
    command: CampaignInvitationCommand,
    session: ClientSession,
  ): Promise<void> {
    return this.write({ command, descriptor: refusalDescriptor(command), includeEmail: false }, session);
  }

  writeCancellation(
    command: CampaignInvitationCommand,
    session: ClientSession,
  ): Promise<void> {
    return this.write({ command, descriptor: cancellationDescriptor(command), includeEmail: false }, session);
  }

  private async write(
    request: InvitationEnvelopeRequest,
    session: ClientSession,
  ): Promise<void> {
    const { command, descriptor, includeEmail } = request;
    const write = { command, descriptor, receiptId: randomUUID() };
    await this.receipts.create([receiptDocument(write)], { session });
    await this.audits.create([auditDocument(write)], { session });
    const messages = [outboxDocument(write)];
    if (includeEmail) messages.push(emailOutboxDocument(write));
    await this.outbox.create(messages, { ordered: true, session });
  }
}

function receiptDocument(write: InvitationEnvelopeWrite): CommandReceiptDocument {
  const { command, descriptor, receiptId } = write;
  const snapshot = command.invitation.snapshot();
  return {
    _id: receiptId,
    schemaVersion: SCHEMA_VERSION,
    principalKey: command.principalId.value,
    idempotencyKey: command.idempotencyKey,
    ownerModule: OWNER_MODULE,
    intentionType: descriptor.intentionType,
    intentHash: command.intentHash,
    status: ACCEPTED_STATUS,
    result: {},
    campaignId: snapshot.campaignId,
    aggregateIds: descriptor.aggregateIds,
    randomResults: [],
    createdAt: command.occurredAt,
    updatedAt: command.occurredAt,
  };
}

function auditDocument(write: InvitationEnvelopeWrite): FunctionalAuditEntryDocument {
  const { command, descriptor } = write;
  const snapshot = command.invitation.snapshot();
  return {
    _id: randomUUID(),
    schemaVersion: SCHEMA_VERSION,
    ownerModule: OWNER_MODULE,
    campaignId: snapshot.campaignId,
    commandReceiptId: write.receiptId,
    actorKey: command.principalId.value,
    effectiveRole: command.effectiveRole,
    action: descriptor.factType,
    aggregateId: snapshot.id,
    revisionBefore: descriptor.revisionBefore,
    revisionAfter: snapshot.revision,
    ...auditPolicy(descriptor.audiencePolicy),
    occurredAt: command.occurredAt,
  };
}

function auditPolicy(audiencePolicy: CampaignAudiencePolicy) {
  return { reasons: [], sources: SOURCES, audiences: [audiencePolicy] };
}

function outboxDocument(write: InvitationEnvelopeWrite): OutboxMessageDocument {
  return baseOutboxDocument(write, {
    factType: write.descriptor.factType,
    audiencePolicy: write.descriptor.audiencePolicy,
    deliveryChannel: OUTBOX_DELIVERY_CHANNEL.realtime,
  });
}

function emailOutboxDocument(write: InvitationEnvelopeWrite): OutboxMessageDocument {
  return baseOutboxDocument(write, {
    factType: CAMPAIGN_FACT.invitationEmailRequested,
    audiencePolicy: OUTBOX_AUDIENCE_POLICY.targetUser,
    deliveryChannel: OUTBOX_DELIVERY_CHANNEL.email,
  });
}

function baseOutboxDocument(
  write: InvitationEnvelopeWrite,
  projection: OutboxProjection,
): OutboxMessageDocument {
  const { command, receiptId } = write;
  const invitation = command.invitation.snapshot();
  return createOutboxMessage({
    ownerModule: OWNER_MODULE,
    campaignId: invitation.campaignId,
    causationId: receiptId,
    aggregateId: invitation.id,
    aggregateRevision: invitation.revision,
    factType: projection.factType,
    fact: invitationFact(invitation),
    audience: campaignAudience(projection.audiencePolicy, invitation.targetUserId),
    deliveryChannel: projection.deliveryChannel,
    occurredAt: command.occurredAt,
  });
}

function invitationFact(
  invitation: ReturnType<CampaignInvitationCommand['invitation']['snapshot']>,
) {
  return {
    campaignId: invitation.campaignId,
    targetUserId: invitation.targetUserId,
    invitedByUserId: invitation.invitedByUserId,
    status: invitation.status,
  };
}

function campaignAudience(
  policy: CampaignAudiencePolicy,
  targetUserId: string,
): CampaignOutboxAudience {
  if (policy === OUTBOX_AUDIENCE_POLICY.targetUser) {
    return { policy, userIds: [targetUserId] };
  }
  return { policy };
}

function creationDescriptor(
  command: CampaignInvitationCommand,
): InvitationEnvelopeDescriptor {
  return descriptor(command, {
    intentionType: 'campaign.invitation.create',
    factType: CAMPAIGN_FACT.invitationCreated,
    audiencePolicy: OUTBOX_AUDIENCE_POLICY.targetUser,
    revisionBefore: null,
  });
}

function acceptanceDescriptor(
  command: CampaignInvitationCommand,
): InvitationEnvelopeDescriptor {
  const snapshot = command.invitation.snapshot();
  return {
    ...descriptor(command, {
      intentionType: 'campaign.invitation.accept',
      factType: CAMPAIGN_FACT.invitationAccepted,
      audiencePolicy: OUTBOX_AUDIENCE_POLICY.campaignMembers,
      revisionBefore: snapshot.revision - 1,
    }),
    aggregateIds: [snapshot.id, snapshot.campaignId],
  };
}

function refusalDescriptor(
  command: CampaignInvitationCommand,
): InvitationEnvelopeDescriptor {
  return terminalDescriptor(command, {
    intentionType: 'campaign.invitation.refuse',
    factType: CAMPAIGN_FACT.invitationRefused,
    audiencePolicy: OUTBOX_AUDIENCE_POLICY.campaignGameMasters,
  });
}

function cancellationDescriptor(
  command: CampaignInvitationCommand,
): InvitationEnvelopeDescriptor {
  return terminalDescriptor(command, {
    intentionType: 'campaign.invitation.cancel',
    factType: CAMPAIGN_FACT.invitationCancelled,
    audiencePolicy: OUTBOX_AUDIENCE_POLICY.targetUser,
  });
}

function terminalDescriptor(
  command: CampaignInvitationCommand,
  policy: DescriptorPolicy,
): InvitationEnvelopeDescriptor {
  const revisionBefore = command.invitation.revision - 1;
  return descriptor(command, { ...policy, revisionBefore });
}

function descriptor(
  command: CampaignInvitationCommand,
  configuration: DescriptorConfiguration,
): InvitationEnvelopeDescriptor {
  const { intentionType, factType, audiencePolicy, revisionBefore } = configuration;
  return {
    intentionType,
    factType,
    audiencePolicy,
    aggregateIds: [command.invitation.id.value],
    revisionBefore,
  };
}
