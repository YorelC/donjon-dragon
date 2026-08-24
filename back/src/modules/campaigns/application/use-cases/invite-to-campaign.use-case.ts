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
  CAMPAIGN_INVITATION_REPOSITORY,
  type CampaignInvitationCommand,
  type CampaignInvitationRepositoryPort,
} from '../ports/campaign-invitation.repository.port';
import {
  CAMPAIGN_REPOSITORY,
  type CampaignRepositoryPort,
} from '../ports/campaign.repository.port';
import {
  FRIENDSHIP_CHECKER,
  type FriendshipCheckerPort,
} from '../ports/friendship-checker.port';
import type { Campaign } from '../../domain/campaign';
import { CampaignInvitation } from '../../domain/campaign-invitation';
import { CampaignId } from '../../domain/campaign-id';
import {
  AlreadyOpenCampaignInvitationError,
  CampaignNotFoundError,
  InviteeIsNotAFriendError,
  InviteeNotFoundError,
} from '../../domain/campaign.errors';
import { hashInvitationCreation } from '../campaign-intent';
import {
  assertSameInvitationIntent,
  wasInvitationReplayed,
} from '../campaign-invitation-replay';

export interface InviteToCampaignDto {
  campaignId: string;
  displayName: string;
  inviterId: ActorId;
  idempotencyKey: string;
}

@Injectable()
export class InviteToCampaignUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepo: CampaignRepositoryPort,
    @Inject(CAMPAIGN_INVITATION_REPOSITORY)
    private readonly invitationRepo: CampaignInvitationRepositoryPort,
    @Inject(CAMPAIGN_DIRECTORY)
    private readonly directory: CampaignDirectoryPort,
    @Inject(FRIENDSHIP_CHECKER)
    private readonly friendship: FriendshipCheckerPort,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: InviteToCampaignDto): Promise<void> {
    const inviterId = UserId.create(dto.inviterId);
    const intentHash = hashInvitationCreation(dto.campaignId, dto.displayName);
    const replay = { principalId: inviterId, idempotencyKey: dto.idempotencyKey, intentHash };
    if (await wasInvitationReplayed(this.invitationRepo, replay)) return;
    const campaign = await this.loadCampaign(dto.campaignId);
    campaign.assertIsGameMaster(inviterId);
    const invitee = await this.resolveFriend(dto.inviterId, dto.displayName);
    const command = await this.prepareInvitation(dto, campaign, invitee);
    const receipt = await this.invitationRepo.create(command);
    assertSameInvitationIntent(receipt, intentHash);
  }

  private async prepareInvitation(
    dto: InviteToCampaignDto,
    campaign: Campaign,
    invitee: DirectoryUser,
  ): Promise<CampaignInvitationCommand> {
    const inviterId = UserId.create(dto.inviterId);
    const inviteeId = UserId.create(invitee.id);
    campaign.assertCanInvite(inviterId, inviteeId);
    await this.assertNoOpenInvitation(campaign.id, inviteeId);
    const state = this.createInvitation(campaign.id, inviteeId, inviterId);
    return {
      ...state,
      principalId: inviterId,
      idempotencyKey: dto.idempotencyKey,
      intentHash: hashInvitationCreation(dto.campaignId, dto.displayName),
      effectiveRole: 'gameMaster',
    };
  }

  private createInvitation(
    campaignId: CampaignId,
    inviteeId: UserId,
    inviterId: UserId,
  ): Pick<CampaignInvitationCommand, 'invitation' | 'occurredAt'> {
    const occurredAt = this.clock.now();
    const invitation = CampaignInvitation.create({
      campaignId,
      targetUserId: inviteeId,
      invitedByUserId: inviterId,
      now: occurredAt,
    });
    return { invitation, occurredAt };
  }

  private async assertNoOpenInvitation(
    campaignId: CampaignId,
    inviteeId: UserId,
  ): Promise<void> {
    const existing = await this.invitationRepo.findOpen(campaignId, inviteeId);
    if (existing) throw new AlreadyOpenCampaignInvitationError();
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
