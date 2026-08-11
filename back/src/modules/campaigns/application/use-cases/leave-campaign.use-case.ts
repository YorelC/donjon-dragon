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

export interface LeaveCampaignDto {
  campaignId: string;
  successorDisplayName?: string;
  actorId: ActorId;
}

/**
 * Le départ du propriétaire emporte le transfert : une seule écriture, donc pas
 * d'état intermédiaire où la propriété aurait bougé sans que le partant s'en aille.
 */
@Injectable()
export class LeaveCampaignUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepo: CampaignRepositoryPort,
    @Inject(CAMPAIGN_DIRECTORY)
    private readonly directory: CampaignDirectoryPort,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: LeaveCampaignDto): Promise<void> {
    const campaign = await loadCampaign(this.campaignRepo, dto.campaignId);
    const actorId = UserId.create(dto.actorId);

    campaign.assertIsActiveMember(actorId);
    const successorId = await this.resolveSuccessor(dto.successorDisplayName);

    campaign.leave(actorId, successorId, this.clock.now());
    await this.campaignRepo.save(campaign);
  }

  /** L'agrégat décide si un successeur était requis ; ici on ne fait que le lire. */
  private async resolveSuccessor(
    displayName: string | undefined,
  ): Promise<UserId | null> {
    if (!displayName) return null;

    return resolveMemberId(this.directory, displayName);
  }
}
