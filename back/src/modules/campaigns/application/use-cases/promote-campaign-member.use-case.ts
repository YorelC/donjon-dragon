import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '@kernel/application/clock.port';
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
import { loadCampaign, resolveMemberId } from '../campaign.lookup';

export interface PromoteCampaignMemberDto {
  campaignId: string;
  displayName: string;
  actorId: ActorId;
}

@Injectable()
export class PromoteCampaignMemberUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepo: CampaignRepositoryPort,
    @Inject(CAMPAIGN_DIRECTORY)
    private readonly directory: CampaignDirectoryPort,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: PromoteCampaignMemberDto): Promise<void> {
    const campaign = await loadCampaign(this.campaignRepo, dto.campaignId);
    const actorId = UserId.create(dto.actorId);

    campaign.assertIsGameMaster(actorId);
    const targetId = await resolveMemberId(this.directory, dto.displayName);

    campaign.promote(actorId, targetId, this.clock.now());
    await this.campaignRepo.save(campaign);
  }
}
