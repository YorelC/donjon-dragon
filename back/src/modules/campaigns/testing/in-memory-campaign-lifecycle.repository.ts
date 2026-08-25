import type { UserId } from '@kernel/domain/user-id';

import type {
  CampaignLifecycleCommand,
  CampaignLifecycleReceipt,
  CampaignLifecycleRepositoryPort,
} from '../application/ports/campaign-lifecycle.repository.port';
import type { CampaignMutationParticipant } from '../application/campaign-lifecycle-participant';
import { InMemoryCampaignRepository } from './in-memory-campaign.repository';

export class InMemoryCampaignLifecycleRepository
  implements CampaignLifecycleRepositoryPort
{
  private readonly receipts = new Map<string, CampaignLifecycleReceipt>();

  constructor(private readonly campaigns: InMemoryCampaignRepository) {}

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

  async findReceipt(
    principalId: UserId,
    idempotencyKey: string,
  ): Promise<CampaignLifecycleReceipt | null> {
    return this.receipts.get(receiptKey(principalId, idempotencyKey)) ?? null;
  }

  private async execute(
    command: CampaignLifecycleCommand,
    participant: CampaignMutationParticipant,
  ): Promise<CampaignLifecycleReceipt> {
    const key = receiptKey(command.principalId, command.idempotencyKey);
    const existing = this.receipts.get(key);
    if (existing) return existing;
    await participant({
      transaction: { handle: {} },
      campaignId: command.campaign.id.value,
      userId: command.participantUserId,
      occurredAt: command.occurredAt,
    });
    const receipt = { intentHash: command.intentHash, result: command.result };
    await this.campaigns.save(command.campaign);
    this.receipts.set(key, receipt);
    return receipt;
  }
}

function receiptKey(principalId: UserId, idempotencyKey: string): string {
  return `${principalId.value}:${idempotencyKey}`;
}

async function noParticipant(): Promise<string[]> {
  return [];
}
