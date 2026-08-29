import { Injectable } from '@nestjs/common';

import { GetCampaignAudienceUseCase } from '@modules/campaigns/application/use-cases/get-campaign-audience.use-case';
import type { CampaignAudiencePort } from '../../application/ports/campaign-audience.port';

/**
 * SEUL fichier du module temps réel qui connaît le module campagne.
 *
 * Il délègue au use-case, jamais au repository : le relais est en lecture seule
 * sur cet agrégat et n'a aucun moyen d'y écrire.
 */
@Injectable()
export class CampaignRealtimeAudience implements CampaignAudiencePort {
  constructor(private readonly audience: GetCampaignAudienceUseCase) {}

  async activeMemberIds(campaignId: string): Promise<readonly string[]> {
    const { memberIds } = await this.audience.execute(campaignId);
    return memberIds;
  }

  async activeGameMasterIds(campaignId: string): Promise<readonly string[]> {
    const { gameMasterIds } = await this.audience.execute(campaignId);
    return gameMasterIds;
  }
}
