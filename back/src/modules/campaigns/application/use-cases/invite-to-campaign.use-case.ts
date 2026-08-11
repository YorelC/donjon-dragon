import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '@kernel/application/clock.port';
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
import {
  FRIENDSHIP_CHECKER,
  type FriendshipCheckerPort,
} from '../ports/friendship-checker.port';
import type { Campaign } from '../../domain/campaign';
import { CampaignId } from '../../domain/campaign-id';
import {
  CampaignNotFoundError,
  InviteeIsNotAFriendError,
  InviteeNotFoundError,
} from '../../domain/campaign.errors';

export interface InviteToCampaignDto {
  campaignId: string;
  displayName: string;
  inviterId: ActorId;
}

@Injectable()
export class InviteToCampaignUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepo: CampaignRepositoryPort,
    @Inject(CAMPAIGN_DIRECTORY)
    private readonly directory: CampaignDirectoryPort,
    @Inject(FRIENDSHIP_CHECKER)
    private readonly friendship: FriendshipCheckerPort,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: InviteToCampaignDto): Promise<void> {
    const campaign = await this.loadCampaign(dto.campaignId);
    const inviterId = UserId.create(dto.inviterId);

    // Avant toute résolution de pseudo : sinon la route dit à un étranger si un
    // pseudo existe, et devient un oracle d'annuaire.
    campaign.assertIsGameMaster(inviterId);

    const invitee = await this.resolveFriend(dto.inviterId, dto.displayName);
    campaign.invite(inviterId, UserId.create(invitee.id), this.clock.now());
    await this.campaignRepo.save(campaign);
  }

  private async loadCampaign(campaignId: string): Promise<Campaign> {
    const campaign = await this.campaignRepo.findById(CampaignId.create(campaignId));
    if (!campaign) throw new CampaignNotFoundError();

    return campaign;
  }

  private async resolveFriend(
    inviterId: string,
    displayName: string,
  ): Promise<DirectoryUser> {
    const invitee = await this.directory.findByDisplayName(displayName);
    if (!invitee) throw new InviteeNotFoundError();

    const friends = await this.friendship.areFriends(inviterId, invitee.id);
    if (!friends) throw new InviteeIsNotAFriendError();

    return invitee;
  }
}
