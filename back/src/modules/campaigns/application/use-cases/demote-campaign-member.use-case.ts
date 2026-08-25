import { Inject, Injectable } from '@nestjs/common';
import type { CampaignCommandResult } from '@donjon-dragon/shared/campaign-schema';
import { CLOCK, type Clock } from '@kernel/application/clock.port';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import { CAMPAIGN_DIRECTORY, type CampaignDirectoryPort } from '../ports/campaign-directory.port';
import {
  CAMPAIGN_LIFECYCLE_REPOSITORY,
  type CampaignLifecycleCommand,
  type CampaignLifecycleRepositoryPort,
} from '../ports/campaign-lifecycle.repository.port';
import { CAMPAIGN_REPOSITORY, type CampaignRepositoryPort } from '../ports/campaign.repository.port';
import { loadCampaign, resolveMemberId } from '../campaign.lookup';
import { toCampaignCommandResult } from '../campaign-command.mapper';
import { hashMemberDemotion } from '../campaign-intent';
import { acceptedResult, replayCampaignLifecycle } from '../campaign-lifecycle-replay';

export interface DemoteCampaignMemberDto {
  campaignId: string;
  displayName: string;
  expectedRevision: number;
  actorId: ActorId;
  idempotencyKey: string;
}

interface DemotionContext {
  dto: DemoteCampaignMemberDto;
  principalId: UserId;
  idempotencyKey: string;
  intentHash: string;
}

@Injectable()
export class DemoteCampaignMemberUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY) private readonly campaigns: CampaignRepositoryPort,
    @Inject(CAMPAIGN_LIFECYCLE_REPOSITORY)
    private readonly lifecycle: CampaignLifecycleRepositoryPort,
    @Inject(CAMPAIGN_DIRECTORY) private readonly directory: CampaignDirectoryPort,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: DemoteCampaignMemberDto): Promise<CampaignCommandResult> {
    const context = demotionContext(dto);
    const replay = await replayCampaignLifecycle(this.lifecycle, context);
    if (replay) return replay;
    const command = await this.prepare(context);
    const receipt = await this.lifecycle.demote(command);
    return acceptedResult(receipt, context.intentHash);
  }

  private async prepare(context: DemotionContext): Promise<CampaignLifecycleCommand> {
    const { dto, principalId: actorId, intentHash } = context;
    const campaign = await loadCampaign(this.campaigns, dto.campaignId);
    campaign.assertIsOwner(actorId);
    campaign.assertRevision(dto.expectedRevision);
    const targetId = await resolveMemberId(this.directory, dto.displayName);
    const effectiveRole = campaign.roleOf(actorId);
    const occurredAt = this.clock.now();
    campaign.demote(actorId, targetId, occurredAt);
    return {
      campaign, principalId: actorId, participantUserId: targetId,
      idempotencyKey: dto.idempotencyKey, intentHash, occurredAt, effectiveRole,
      factType: 'campaign.member-demoted',
      result: toCampaignCommandResult(
        campaign, actorId, { displayName: dto.displayName, userId: targetId },
      ),
    };
  }
}

function demotionContext(dto: DemoteCampaignMemberDto): DemotionContext {
  return {
    dto,
    principalId: UserId.create(dto.actorId),
    idempotencyKey: dto.idempotencyKey,
    intentHash: hashMemberDemotion(dto.campaignId, dto.displayName, dto.expectedRevision),
  };
}
