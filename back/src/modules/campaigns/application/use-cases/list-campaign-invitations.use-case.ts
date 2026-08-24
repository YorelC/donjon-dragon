import { Inject, Injectable } from '@nestjs/common';
import type { CampaignInvitation } from '@donjon-dragon/shared/campaign-schema';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import {
  CAMPAIGN_DIRECTORY,
  type CampaignDirectoryPort,
} from '../ports/campaign-directory.port';
import {
  CAMPAIGN_INVITATION_REPOSITORY,
  type CampaignInvitationRepositoryPort,
} from '../ports/campaign-invitation.repository.port';
import {
  CAMPAIGN_REPOSITORY,
  type CampaignRepositoryPort,
} from '../ports/campaign.repository.port';
import type { Campaign } from '../../domain/campaign';
import type { CampaignInvitation as InvitationAggregate } from '../../domain/campaign-invitation';
import { CampaignNotFoundError } from '../../domain/campaign.errors';
import { toCampaignInvitation } from '../campaign.mapper';

export interface ListCampaignInvitationsDto {
  userId: ActorId;
}

@Injectable()
export class ListCampaignInvitationsUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepo: CampaignRepositoryPort,
    @Inject(CAMPAIGN_INVITATION_REPOSITORY)
    private readonly invitationRepo: CampaignInvitationRepositoryPort,
    @Inject(CAMPAIGN_DIRECTORY)
    private readonly directory: CampaignDirectoryPort,
  ) {}

  async execute(dto: ListCampaignInvitationsDto): Promise<CampaignInvitation[]> {
    const userId = UserId.create(dto.userId);
    const invitations = await this.invitationRepo.listOpenForTarget(userId);
    const projected = await Promise.all(
      invitations.map((invitation) => this.project(invitation)),
    );
    return projected.filter(isInvitation);
  }

  private async project(
    invitation: InvitationAggregate,
  ): Promise<CampaignInvitation | null> {
    const campaign = await this.loadCampaign(invitation);
    const inviter = await this.directory.findById(invitation.invitedByUserId.value);
    return inviter ? toCampaignInvitation(invitation, campaign, inviter) : null;
  }

  private async loadCampaign(invitation: InvitationAggregate): Promise<Campaign> {
    const campaign = await this.campaignRepo.findById(invitation.campaignId);
    if (!campaign) throw new CampaignNotFoundError();
    return campaign;
  }
}

function isInvitation(
  invitation: CampaignInvitation | null,
): invitation is CampaignInvitation {
  return invitation !== null;
}
