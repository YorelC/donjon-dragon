import { Inject, Injectable } from '@nestjs/common';
import type { CampaignSummary } from '@donjon-dragon/shared/campaign-schema';
import { CLOCK, type Clock } from '@kernel/application/clock.port';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import {
  CAMPAIGN_REPOSITORY,
  type CampaignRepositoryPort,
} from '../ports/campaign.repository.port';
import { Campaign } from '../../domain/campaign';
import { CampaignName } from '../../domain/campaign-name';
import { toCampaignSummary } from '../campaign.mapper';

export interface CreateCampaignDto {
  name: string;
  founderId: ActorId;
}

@Injectable()
export class CreateCampaignUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepo: CampaignRepositoryPort,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: CreateCampaignDto): Promise<CampaignSummary> {
    const founderId = UserId.create(dto.founderId);

    // L'agrégat porte la règle : le créateur en est le premier maître du jeu.
    const campaign = Campaign.create(
      CampaignName.create(dto.name),
      founderId,
      this.clock.now(),
    );
    await this.campaignRepo.save(campaign);

    return toCampaignSummary(campaign, founderId);
  }
}
