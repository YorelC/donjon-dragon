import { Inject, Injectable } from '@nestjs/common';
import type { CampaignDetail } from '@donjon-dragon/shared/campaign-schema';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import {
  CAMPAIGN_DIRECTORY,
  type CampaignDirectoryPort,
} from '../ports/campaign-directory.port';
import {
  CAMPAIGN_REPOSITORY,
  type CampaignRepositoryPort,
} from '../ports/campaign.repository.port';
import { everyoneIn, toCampaignDetail } from '../campaign.mapper';
import { loadCampaign } from '../campaign.lookup';

export interface GetCampaignDetailDto {
  campaignId: string;
  userId: ActorId;
}

@Injectable()
export class GetCampaignDetailUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepo: CampaignRepositoryPort,
    @Inject(CAMPAIGN_DIRECTORY)
    private readonly directory: CampaignDirectoryPort,
  ) {}

  async execute(dto: GetCampaignDetailDto): Promise<CampaignDetail> {
    const campaign = await loadCampaign(this.campaignRepo, dto.campaignId);
    const viewerId = UserId.create(dto.userId);

    // Une seule erreur couvre l'absence et l'invisibilité pour ne pas révéler
    // l'existence d'une campagne privée.
    campaign.assertIsVisibleTo(viewerId);

    const directory = await this.directory.findManyByIds(everyoneIn(campaign));
    return toCampaignDetail(campaign, viewerId, directory);
  }
}
