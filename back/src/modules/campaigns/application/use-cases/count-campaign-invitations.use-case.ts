import { Inject, Injectable } from '@nestjs/common';
import type { PendingCampaignInvitationCount } from '@donjon-dragon/shared/campaign-schema';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import {
  CAMPAIGN_REPOSITORY,
  type CampaignRepositoryPort,
} from '../ports/campaign.repository.port';

export interface CountCampaignInvitationsDto {
  userId: ActorId;
}

/**
 * Compte sans charger : le badge n'a besoin que du nombre, et lister les
 * campagnes pour en prendre la longueur ferait payer la résolution des inviteurs
 * à chaque rafraîchissement.
 */
@Injectable()
export class CountCampaignInvitationsUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepo: CampaignRepositoryPort,
  ) {}

  async execute(
    dto: CountCampaignInvitationsDto,
  ): Promise<PendingCampaignInvitationCount> {
    const count = await this.campaignRepo.countPendingForUser(
      UserId.create(dto.userId),
    );

    return { count };
  }
}
