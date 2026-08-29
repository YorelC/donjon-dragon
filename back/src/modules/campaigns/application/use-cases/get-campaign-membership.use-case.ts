import { Inject, Injectable } from '@nestjs/common';

import {
  CAMPAIGN_REPOSITORY,
  type CampaignRepositoryPort,
} from '../ports/campaign.repository.port';
import { loadCampaign } from '../campaign.lookup';
import { membershipOf, type CampaignMembership } from '../campaign-membership';

/**
 * `userId` n'est PAS typé `ActorId` : cette requête sert aussi à qualifier une
 * CIBLE (créateur d'un personnage, joueur à qui l'attribuer), pas seulement
 * l'appelant authentifié. Le typage `ActorId` reste la garde sur les routes
 * HTTP ; cette requête est un outil de lecture interne aux use-cases.
 */
export interface GetCampaignMembershipDto {
  campaignId: string;
  userId: string;
}

/**
 * Requête de lecture pure sur l'appartenance à une campagne, exportée pour les
 * modules voisins (characters) qui doivent vérifier un rôle sans dupliquer un
 * port miroir de campaigns.repository.port.
 */
@Injectable()
export class GetCampaignMembershipUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepo: CampaignRepositoryPort,
  ) {}

  async execute(dto: GetCampaignMembershipDto): Promise<CampaignMembership> {
    const campaign = await loadCampaign(this.campaignRepo, dto.campaignId);
    return membershipOf(campaign, dto.userId);
  }
}
