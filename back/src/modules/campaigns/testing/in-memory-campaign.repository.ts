import type { UserId } from '@kernel/domain/user-id';

import type {
  CampaignCreationCommand,
  CampaignCreationReceipt,
  CampaignRepositoryPort,
} from '../application/ports/campaign.repository.port';
import type { Campaign } from '../domain/campaign';
import type { CampaignId } from '../domain/campaign-id';

export class InMemoryCampaignRepository implements CampaignRepositoryPort {
  private readonly campaigns = new Map<string, Campaign>();
  private readonly receipts = new Map<string, CampaignCreationReceipt>();

  async create(command: CampaignCreationCommand): Promise<CampaignCreationReceipt> {
    const key = receiptKey(command);
    const existing = this.receipts.get(key);
    if (existing) return existing;

    const receipt = toReceipt(command);
    this.receipts.set(key, receipt);
    await this.save(command.campaign);
    return receipt;
  }

  async save(campaign: Campaign): Promise<void> {
    this.campaigns.set(campaign.id.value, campaign);
  }

  async findById(id: CampaignId): Promise<Campaign | null> {
    return this.campaigns.get(id.value) ?? null;
  }

  async listActiveForUser(userId: UserId): Promise<Campaign[]> {
    return this.all().filter((campaign) =>
      contains([...campaign.gameMasters(), ...campaign.players()], userId),
    );
  }

  async listPendingForUser(userId: UserId): Promise<Campaign[]> {
    return this.all().filter((campaign) =>
      contains(campaign.pendingInvitees(), userId),
    );
  }

  async countPendingForUser(userId: UserId): Promise<number> {
    return (await this.listPendingForUser(userId)).length;
  }

  async deleteById(id: CampaignId): Promise<void> {
    this.campaigns.delete(id.value);
  }

  private all(): Campaign[] {
    return [...this.campaigns.values()];
  }
}

function receiptKey(command: CampaignCreationCommand): string {
  return `${command.principalId.value}:${command.idempotencyKey}`;
}

function toReceipt(command: CampaignCreationCommand): CampaignCreationReceipt {
  const campaign = command.campaign;
  return {
    intentHash: command.intentHash,
    result: {
      campaignId: campaign.id.value,
      name: campaign.name.value,
      ownerUserId: campaign.ownerId.value,
      gameMasterCount: campaign.gameMasters().length,
      playerCount: campaign.players().length,
    },
  };
}

const contains = (userIds: UserId[], userId: UserId): boolean =>
  userIds.some((candidate) => candidate.equals(userId));
