import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '@kernel/application/clock.port';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import {
  CAMPAIGN_INVITATION_REPOSITORY,
  type CampaignInvitationAcceptanceCommand,
  type CampaignInvitationRepositoryPort,
} from '../ports/campaign-invitation.repository.port';
import {
  CAMPAIGN_REPOSITORY,
  type CampaignRepositoryPort,
} from '../ports/campaign.repository.port';
import { CampaignId } from '../../domain/campaign-id';
import {
  CampaignNotFoundError,
  NoPendingCampaignInvitationError,
} from '../../domain/campaign.errors';
import { hashInvitationAcceptance } from '../campaign-intent';
import {
  assertSameInvitationIntent,
  wasInvitationReplayed,
} from '../campaign-invitation-replay';

export interface AcceptCampaignInvitationDto {
  campaignId: string;
  userId: ActorId;
  idempotencyKey: string;
}

interface AcceptanceCommandContext {
  dto: AcceptCampaignInvitationDto;
  principalId: UserId;
  intentHash: string;
  state: Pick<CampaignInvitationAcceptanceCommand, 'invitation' | 'campaign' | 'occurredAt'>;
}

@Injectable()
export class AcceptCampaignInvitationUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepo: CampaignRepositoryPort,
    @Inject(CAMPAIGN_INVITATION_REPOSITORY)
    private readonly invitationRepo: CampaignInvitationRepositoryPort,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: AcceptCampaignInvitationDto): Promise<void> {
    const principalId = UserId.create(dto.userId);
    const intentHash = hashInvitationAcceptance(dto.campaignId);
    const replay = { principalId, idempotencyKey: dto.idempotencyKey, intentHash };
    if (await wasInvitationReplayed(this.invitationRepo, replay)) return;
    const command = await this.prepareAcceptance(dto, principalId, intentHash);
    const receipt = await this.invitationRepo.accept(command);
    assertSameInvitationIntent(receipt, intentHash);
  }

  private async prepareAcceptance(
    dto: AcceptCampaignInvitationDto,
    principalId: UserId,
    intentHash: string,
  ): Promise<CampaignInvitationAcceptanceCommand> {
    const campaignId = CampaignId.create(dto.campaignId);
    const invitation = await this.invitationRepo.findOpen(campaignId, principalId);
    if (!invitation) throw new NoPendingCampaignInvitationError();
    const campaign = await this.campaignRepo.findById(campaignId);
    if (!campaign) throw new CampaignNotFoundError();
    const occurredAt = this.clock.now();
    invitation.accept(principalId, occurredAt);
    campaign.joinFromInvitation(principalId, invitation.invitedByUserId, occurredAt);
    return this.acceptanceCommand({
      dto,
      principalId,
      intentHash,
      state: { invitation, campaign, occurredAt },
    });
  }

  private acceptanceCommand(context: AcceptanceCommandContext): CampaignInvitationAcceptanceCommand {
    const { dto, principalId, intentHash, state } = context;
    return {
      ...state,
      principalId,
      idempotencyKey: dto.idempotencyKey,
      intentHash,
      effectiveRole: null,
    };
  }
}
