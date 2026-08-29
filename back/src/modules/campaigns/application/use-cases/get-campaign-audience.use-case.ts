import { Inject, Injectable } from '@nestjs/common';

import {
  CAMPAIGN_REPOSITORY,
  type CampaignRepositoryPort,
} from '../ports/campaign.repository.port';
import { loadCampaign } from '../campaign.lookup';

export interface CampaignAudience {
  memberIds: string[];
  gameMasterIds: string[];
}

/**
 * Qui doit être prévenu d'un fait appartenant à cette campagne.
 *
 * Les adhésions sont relues à chaque appel, comme l'exige la diffusion après
 * commit : un membre exclu ou rétrogradé entre l'écriture du fait et son
 * émission ne doit pas le recevoir. Une audience figée dans le message aurait
 * l'effet inverse.
 *
 * Seules les adhésions ACTIVES comptent — `gameMasters()` et `players()` les
 * filtrent déjà.
 */
@Injectable()
export class GetCampaignAudienceUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepo: CampaignRepositoryPort,
  ) {}

  async execute(campaignId: string): Promise<CampaignAudience> {
    const campaign = await loadCampaign(this.campaignRepo, campaignId);
    const gameMasters = campaign.gameMasters();

    return {
      memberIds: [...gameMasters, ...campaign.players()].map((id) => id.value),
      gameMasterIds: gameMasters.map((id) => id.value),
    };
  }
}
