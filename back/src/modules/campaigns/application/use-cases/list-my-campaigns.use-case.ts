import { Inject, Injectable } from '@nestjs/common';
import type { CampaignSummary } from '@donjon-dragon/shared/campaign-schema';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import {
  CAMPAIGN_REPOSITORY,
  type CampaignRepositoryPort,
} from '../ports/campaign.repository.port';
import { toCampaignSummary } from '../campaign.mapper';

export interface ListMyCampaignsDto {
  userId: ActorId;
}

@Injectable()
export class ListMyCampaignsUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepo: CampaignRepositoryPort,
  ) {}

  async execute(dto: ListMyCampaignsDto): Promise<CampaignSummary[]> {
    const userId = UserId.create(dto.userId);
    const campaigns = await this.campaignRepo.listActiveForUser(userId);

    return campaigns.map((campaign) => toCampaignSummary(campaign, userId));
  }
}
