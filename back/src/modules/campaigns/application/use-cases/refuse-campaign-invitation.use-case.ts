import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '@kernel/application/clock.port';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import {
  CAMPAIGN_INVITATION_REPOSITORY,
  type CampaignInvitationRepositoryPort,
} from '../ports/campaign-invitation.repository.port';
import { CampaignId } from '../../domain/campaign-id';
import { NoPendingCampaignInvitationError } from '../../domain/campaign.errors';
import { hashInvitationRefusal } from '../campaign-intent';
import {
  assertSameInvitationIntent,
  wasInvitationReplayed,
} from '../campaign-invitation-replay';

export interface RefuseCampaignInvitationDto {
  campaignId: string;
  userId: ActorId;
  idempotencyKey: string;
}

@Injectable()
export class RefuseCampaignInvitationUseCase {
  constructor(
    @Inject(CAMPAIGN_INVITATION_REPOSITORY)
    private readonly invitationRepo: CampaignInvitationRepositoryPort,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: RefuseCampaignInvitationDto): Promise<void> {
    const principalId = UserId.create(dto.userId);
    const intentHash = hashInvitationRefusal(dto.campaignId);
    const replay = { principalId, idempotencyKey: dto.idempotencyKey, intentHash };
    if (await wasInvitationReplayed(this.invitationRepo, replay)) return;
    const campaignId = CampaignId.create(dto.campaignId);
    const invitation = await this.invitationRepo.findOpen(campaignId, principalId);
    if (!invitation) throw new NoPendingCampaignInvitationError();
    const occurredAt = this.clock.now();
    invitation.refuse(principalId, occurredAt);
    const receipt = await this.invitationRepo.refuse({
      invitation,
      principalId,
      idempotencyKey: dto.idempotencyKey,
      intentHash,
      occurredAt,
      effectiveRole: null,
    });
    assertSameInvitationIntent(receipt, intentHash);
  }
}
