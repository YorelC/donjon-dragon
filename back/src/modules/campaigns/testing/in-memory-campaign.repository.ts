import type { UserId } from '@kernel/domain/user-id';

import type { CampaignRepositoryPort } from '../application/ports/campaign.repository.port';
import type { Campaign } from '../domain/campaign';
import type { CampaignId } from '../domain/campaign-id';

export class InMemoryCampaignRepository implements CampaignRepositoryPort {
  private readonly campaigns = new Map<string, Campaign>();

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

const contains = (userIds: UserId[], userId: UserId): boolean =>
  userIds.some((candidate) => candidate.equals(userId));
