import { Injectable } from '@nestjs/common';
import type { ClientSession } from 'mongoose';
import type { UserId } from '@kernel/domain/user-id';

import type {
  CampaignLifecycleCommand,
  CampaignLifecycleReceipt,
  CampaignLifecycleRepositoryPort,
} from '../../application/ports/campaign-lifecycle.repository.port';
import type { CampaignMutationParticipant } from '../../application/campaign-lifecycle-participant';
import { MongoCampaignLifecycleEnvelopeRepository } from './mongo-campaign-lifecycle-envelope.repository';
import { MongoCampaignPersistenceRepository } from './mongo-campaign-persistence.repository';

const DUPLICATE_KEY_ERROR = 11000;

@Injectable()
export class MongoCampaignLifecycleRepository
  implements CampaignLifecycleRepositoryPort
{
  constructor(
    private readonly campaigns: MongoCampaignPersistenceRepository,
    private readonly envelopes: MongoCampaignLifecycleEnvelopeRepository,
  ) {}

  promote(
    command: CampaignLifecycleCommand,
    participant: CampaignMutationParticipant,
  ): Promise<CampaignLifecycleReceipt> {
    return this.execute(command, participant);
  }

  demote(command: CampaignLifecycleCommand): Promise<CampaignLifecycleReceipt> {
    return this.execute(command, noParticipant);
  }

  exclude(
    command: CampaignLifecycleCommand,
    participant: CampaignMutationParticipant,
  ): Promise<CampaignLifecycleReceipt> {
    return this.execute(command, participant);
  }

  transfer(command: CampaignLifecycleCommand): Promise<CampaignLifecycleReceipt> {
    return this.execute(command, noParticipant);
  }

  leave(
    command: CampaignLifecycleCommand,
    participant: CampaignMutationParticipant,
  ): Promise<CampaignLifecycleReceipt> {
    return this.execute(command, participant);
  }

  findReceipt(
    principalId: UserId,
    idempotencyKey: string,
  ): Promise<CampaignLifecycleReceipt | null> {
    return this.envelopes.findReceipt(principalId.value, idempotencyKey);
  }

  private async execute(
    command: CampaignLifecycleCommand,
    participant: CampaignMutationParticipant,
  ): Promise<CampaignLifecycleReceipt> {
    const existing = await this.findReceipt(command.principalId, command.idempotencyKey);
    if (existing) return existing;
    try {
      return await this.campaigns.transaction((session) =>
        this.persist(command, participant, session),
      );
    } catch (error) {
      return this.recover(command, error);
    }
  }

  private async persist(
    command: CampaignLifecycleCommand,
    participant: CampaignMutationParticipant,
    session: ClientSession,
  ): Promise<CampaignLifecycleReceipt> {
    const participantIds = await participant(participantRequest(command, session));
    await this.envelopes.write(command, participantIds, session);
    await this.campaigns.save(command.campaign, session);
    return { intentHash: command.intentHash, result: command.result };
  }

  private async recover(
    command: CampaignLifecycleCommand,
    error: unknown,
  ): Promise<CampaignLifecycleReceipt> {
    if (!isDuplicateKey(error)) throw error;
    const receipt = await this.findReceipt(command.principalId, command.idempotencyKey);
    if (receipt) return receipt;
    throw error;
  }
}

function participantRequest(
  command: CampaignLifecycleCommand,
  session: ClientSession,
) {
  return {
    transaction: { handle: session },
    campaignId: command.campaign.id.value,
    userId: command.participantUserId,
    occurredAt: command.occurredAt,
  };
}

async function noParticipant(): Promise<string[]> {
  return [];
}

function isDuplicateKey(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  return 'code' in error && error.code === DUPLICATE_KEY_ERROR;
}
