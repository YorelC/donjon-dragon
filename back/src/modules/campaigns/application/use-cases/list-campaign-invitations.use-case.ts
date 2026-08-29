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

  /**
   * Trois lectures quel que soit le nombre d'invitations : les invitations, puis
   * les campagnes et les invitants en lot. Projeter ligne par ligne relisait la
   * campagne ET l'annuaire pour chacune.
   */
  async execute(dto: ListCampaignInvitationsDto): Promise<CampaignInvitation[]> {
    const userId = UserId.create(dto.userId);
    const invitations = await this.invitationRepo.listOpenForTarget(userId);
    const campaigns = await this.indexCampaigns(invitations);
    const inviters = await this.indexInviters(invitations);

    return invitations
      .map((invitation) => project(invitation, campaigns, inviters))
      .filter(isInvitation);
  }

  private async indexCampaigns(
    invitations: InvitationAggregate[],
  ): Promise<Map<string, Campaign>> {
    const campaigns = await this.campaignRepo.findManyByIds(
      invitations.map((invitation) => invitation.campaignId),
    );
    return new Map(campaigns.map((campaign) => [campaign.id.value, campaign]));
  }

  private async indexInviters(
    invitations: InvitationAggregate[],
  ): Promise<Map<string, DirectoryUser>> {
    const ids = invitations.map((invitation) => invitation.invitedByUserId.value);
    const users = await this.directory.findManyByIds([...new Set(ids)]);
    return new Map(users.map((user) => [user.id, user]));
  }
}

/**
 * Projection sans I/O. L'asymetrie est celle d'avant : une campagne absente est
 * une incoherence de donnees, un invitant absent est une ligne qu'on tait.
 */
function project(
  invitation: InvitationAggregate,
  campaigns: Map<string, Campaign>,
  inviters: Map<string, DirectoryUser>,
): CampaignInvitation | null {
  const campaign = campaigns.get(invitation.campaignId.value);
  if (!campaign) throw new CampaignNotFoundError();

  const inviter = inviters.get(invitation.invitedByUserId.value);
  return inviter ? toCampaignInvitation(invitation, campaign, inviter) : null;
}

function isInvitation(
  invitation: CampaignInvitation | null,
): invitation is CampaignInvitation {
  return invitation !== null;
}
