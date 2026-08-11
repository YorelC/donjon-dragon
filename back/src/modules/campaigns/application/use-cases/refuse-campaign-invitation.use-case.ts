import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '@kernel/application/clock.port';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import {
  CAMPAIGN_REPOSITORY,
  type CampaignRepositoryPort,
} from '../ports/campaign.repository.port';
import { CampaignId } from '../../domain/campaign-id';
import { CampaignNotFoundError } from '../../domain/campaign.errors';

export interface RefuseCampaignInvitationDto {
  campaignId: string;
  userId: ActorId;
}

@Injectable()
export class RefuseCampaignInvitationUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepo: CampaignRepositoryPort,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: RefuseCampaignInvitationDto): Promise<void> {
    const campaign = await this.campaignRepo.findById(
      CampaignId.create(dto.campaignId),
    );
    if (!campaign) throw new CampaignNotFoundError();

    // Un refus ne laisse rien : le membre disparaît, le maître du jeu peut
    // réinviter aussitôt.
    campaign.refuseInvitation(UserId.create(dto.userId), this.clock.now());
    await this.campaignRepo.save(campaign);
  }
}
