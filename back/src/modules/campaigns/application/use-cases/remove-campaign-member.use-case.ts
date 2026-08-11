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

export interface RemoveCampaignMemberDto {
  campaignId: string;
  displayName: string;
  actorId: ActorId;
}

/**
 * Retirer un joueur et annuler son invitation sont le même geste : dans les deux
 * cas le membre disparaît du document. C'est son statut qui différait, pas l'acte.
 */
@Injectable()
export class RemoveCampaignMemberUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepo: CampaignRepositoryPort,
    @Inject(CAMPAIGN_DIRECTORY)
    private readonly directory: CampaignDirectoryPort,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: RemoveCampaignMemberDto): Promise<void> {
    const campaign = await loadCampaign(this.campaignRepo, dto.campaignId);
    const actorId = UserId.create(dto.actorId);

    campaign.assertIsGameMaster(actorId);
    const targetId = await resolveMemberId(this.directory, dto.displayName);

    campaign.removeMember(actorId, targetId, this.clock.now());
    await this.campaignRepo.save(campaign);
  }
}
