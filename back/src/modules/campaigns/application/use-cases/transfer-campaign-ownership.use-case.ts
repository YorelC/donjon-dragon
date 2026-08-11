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

export interface TransferCampaignOwnershipDto {
  campaignId: string;
  displayName: string;
  actorId: ActorId;
}

@Injectable()
export class TransferCampaignOwnershipUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepo: CampaignRepositoryPort,
    @Inject(CAMPAIGN_DIRECTORY)
    private readonly directory: CampaignDirectoryPort,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: TransferCampaignOwnershipDto): Promise<void> {
    const campaign = await loadCampaign(this.campaignRepo, dto.campaignId);
    const actorId = UserId.create(dto.actorId);

    // Habilitation avant résolution du pseudo, sinon la route renseigne un
    // étranger sur l'existence d'un compte.
    campaign.assertIsOwner(actorId);
    const successorId = await resolveMemberId(this.directory, dto.displayName);

    campaign.transferOwnership(actorId, successorId, this.clock.now());
    await this.campaignRepo.save(campaign);
  }
}
