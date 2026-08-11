import { Inject, Injectable } from '@nestjs/common';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import {
  CAMPAIGN_REPOSITORY,
  type CampaignRepositoryPort,
} from '../ports/campaign.repository.port';
import { loadCampaign } from '../campaign.lookup';

export interface DeleteCampaignDto {
  campaignId: string;
  actorId: ActorId;
}

/**
 * Supprimer est le droit du seul propriétaire, et non de tout maître du jeu :
 * c'est ce qui empêche qu'on détruise la campagne de quelqu'un d'autre.
 */
@Injectable()
export class DeleteCampaignUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepo: CampaignRepositoryPort,
  ) {}

  async execute(dto: DeleteCampaignDto): Promise<void> {
    const campaign = await loadCampaign(this.campaignRepo, dto.campaignId);

    campaign.assertIsOwner(UserId.create(dto.actorId));
    await this.campaignRepo.deleteById(campaign.id);
  }
}
