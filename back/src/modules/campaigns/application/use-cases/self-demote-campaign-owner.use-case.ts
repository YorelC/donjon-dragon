import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '@kernel/application/clock.port';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import {
  CAMPAIGN_REPOSITORY,
  type CampaignRepositoryPort,
} from '../ports/campaign.repository.port';
import { loadCampaign } from '../campaign.lookup';

export interface SelfDemoteCampaignOwnerDto {
  campaignId: string;
  actorId: ActorId;
}

@Injectable()
export class SelfDemoteCampaignOwnerUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepo: CampaignRepositoryPort,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: SelfDemoteCampaignOwnerDto): Promise<void> {
    const campaign = await loadCampaign(this.campaignRepo, dto.campaignId);
    const actorId = UserId.create(dto.actorId);

    campaign.selfDemoteAsOwner(actorId, this.clock.now());
    await this.campaignRepo.save(campaign);
  }
}
