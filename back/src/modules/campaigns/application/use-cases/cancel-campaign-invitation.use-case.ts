import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '@kernel/application/clock.port';
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
import { hashInvitationCancellation } from '../campaign-intent';
import {
  assertSameInvitationIntent,
  wasInvitationReplayed,
} from '../campaign-invitation-replay';
import { loadCampaign } from '../campaign.lookup';
import {
  InviteeNotFoundError,
  NoPendingCampaignInvitationError,
} from '../../domain/campaign.errors';
import { CampaignId } from '../../domain/campaign-id';
import type { CampaignInvitation } from '../../domain/campaign-invitation';

export interface CancelCampaignInvitationDto {
  campaignId: string;
  displayName: string;
  actorId: ActorId;
  idempotencyKey: string;
}

@Injectable()
export class CampaignInvitationCancellationResolver {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY) private campaignRepo: CampaignRepositoryPort,
    @Inject(CAMPAIGN_INVITATION_REPOSITORY)
    private invitationRepo: CampaignInvitationRepositoryPort,
    @Inject(CAMPAIGN_DIRECTORY) private directory: CampaignDirectoryPort,
  ) {}

  async resolve(
    campaignId: string,
    displayName: string,
    actorId: UserId,
  ): Promise<CampaignInvitation> {
    const campaign = await loadCampaign(this.campaignRepo, campaignId);
    campaign.assertIsGameMaster(actorId);
    const target = await this.directory.findByDisplayName(displayName);
    if (!target) throw new InviteeNotFoundError();
    return this.loadOpenInvitation(campaign.id, UserId.create(target.id));
  }

  private async loadOpenInvitation(
    campaignId: CampaignId,
    targetId: UserId,
  ): Promise<CampaignInvitation> {
    const invitation = await this.invitationRepo.findOpen(campaignId, targetId);
    if (!invitation) throw new NoPendingCampaignInvitationError();
    return invitation;
  }
}

@Injectable()
export class CancelCampaignInvitationUseCase {
  constructor(
    private resolver: CampaignInvitationCancellationResolver,
    @Inject(CAMPAIGN_INVITATION_REPOSITORY)
    private invitationRepo: CampaignInvitationRepositoryPort,
    @Inject(CLOCK) private clock: Clock,
  ) {}

  async execute(dto: CancelCampaignInvitationDto): Promise<void> {
    const actorId = UserId.create(dto.actorId);
    const intentHash = hashInvitationCancellation(dto.campaignId, dto.displayName);
    const replay = { principalId: actorId, idempotencyKey: dto.idempotencyKey, intentHash };
    if (await wasInvitationReplayed(this.invitationRepo, replay)) return;
    const command = await this.prepareCancellation(dto, actorId, intentHash);
    const receipt = await this.invitationRepo.cancel(command);
    assertSameInvitationIntent(receipt, intentHash);
  }

  private async prepareCancellation(
    dto: CancelCampaignInvitationDto,
    actorId: UserId,
    intentHash: string,
  ) {
    const invitation = await this.resolver.resolve(dto.campaignId, dto.displayName, actorId);
    const occurredAt = this.clock.now();
    invitation.cancel(occurredAt);
    return {
      invitation,
      principalId: actorId,
      idempotencyKey: dto.idempotencyKey,
      intentHash,
      occurredAt,
      effectiveRole: 'gameMaster',
    };
  }
}
