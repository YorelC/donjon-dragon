import { Inject, Injectable } from '@nestjs/common';
import type { CampaignInvitation } from '@donjon-dragon/shared/campaign-schema';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import {
  CAMPAIGN_DIRECTORY,
  type CampaignDirectoryPort,
  type DirectoryUser,
} from '../ports/campaign-directory.port';
import {
  CAMPAIGN_REPOSITORY,
  type CampaignRepositoryPort,
} from '../ports/campaign.repository.port';
import type { Campaign } from '../../domain/campaign';
import { toCampaignInvitation } from '../campaign.mapper';

export interface ListCampaignInvitationsDto {
  userId: ActorId;
}

@Injectable()
export class ListCampaignInvitationsUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepo: CampaignRepositoryPort,
    @Inject(CAMPAIGN_DIRECTORY)
    private readonly directory: CampaignDirectoryPort,
  ) {}

  async execute(dto: ListCampaignInvitationsDto): Promise<CampaignInvitation[]> {
    const userId = UserId.create(dto.userId);
    const campaigns = await this.campaignRepo.listPendingForUser(userId);

    const invitations: CampaignInvitation[] = [];
    for (const campaign of campaigns) {
      const inviter = await this.resolveInviter(campaign, userId);
      // Une invitation dont l'inviteur a disparu n'est plus lisible : on ne la
      // montre pas plutôt que d'afficher une demande venue de nulle part.
      if (inviter) invitations.push(toCampaignInvitation(campaign, inviter));
    }

    return invitations;
  }

  private async resolveInviter(
    campaign: Campaign,
    userId: UserId,
  ): Promise<DirectoryUser | null> {
    const { invitedBy } = campaign.pendingInvitationFor(userId);

    return invitedBy ? this.directory.findById(invitedBy.value) : null;
  }
}
