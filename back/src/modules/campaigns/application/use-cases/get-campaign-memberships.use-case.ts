import { Inject, Injectable } from '@nestjs/common';

import {
  CAMPAIGN_REPOSITORY,
  type CampaignRepositoryPort,
} from '../ports/campaign.repository.port';
import { loadCampaign } from '../campaign.lookup';
import { membershipOf, type CampaignMembership } from '../campaign-membership';

export interface GetCampaignMembershipsDto {
  campaignId: string;
  userIds: readonly string[];
}

/**
 * Les rôles de PLUSIEURS utilisateurs dans une campagne, en un seul chargement.
 *
 * Qualifier deux personnes appelait deux fois la lecture singulière, donc
 * chargeait deux fois le même agrégat — quatre requêtes pour une information
 * contenue dans un seul document et ses adhésions.
 *
 * À n'appeler qu'avec des identifiants DÉJÀ connus. Résoudre un pseudo pour
 * pouvoir le passer ici reviendrait à interroger l'annuaire avant le contrôle
 * d'habilitation, et transformerait la route en oracle : voir `resolveMemberId`
 * dans `campaign.lookup.ts`.
 */
@Injectable()
export class GetCampaignMembershipsUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepo: CampaignRepositoryPort,
  ) {}

  async execute(dto: GetCampaignMembershipsDto): Promise<Map<string, CampaignMembership>> {
    const campaign = await loadCampaign(this.campaignRepo, dto.campaignId);
    const unique = [...new Set(dto.userIds)];

    return new Map(unique.map((userId) => [userId, membershipOf(campaign, userId)]));
  }
}
