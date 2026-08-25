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
import type { CampaignMutationParticipant } from '../campaign-lifecycle-participant';
import { CAMPAIGN_REPOSITORY, type CampaignRepositoryPort } from '../ports/campaign.repository.port';
import { loadCampaign, resolveMemberId } from '../campaign.lookup';
import { toCampaignCommandResult } from '../campaign-command.mapper';
import { hashMemberExclusion } from '../campaign-intent';
import { acceptedResult, replayCampaignLifecycle } from '../campaign-lifecycle-replay';
import type { Campaign } from '../../domain/campaign';

export interface ExcludeCampaignMemberDto {
  campaignId: string;
  displayName: string;
  expectedRevision: number;
  actorId: ActorId;
  idempotencyKey: string;
}

interface ExclusionContext {
  dto: ExcludeCampaignMemberDto;
  principalId: UserId;
  idempotencyKey: string;
  intentHash: string;
}

interface PreparedExclusion {
  context: ExclusionContext;
  campaign: Campaign;
  targetId: UserId;
  effectiveRole: string;
  occurredAt: Date;
}

@Injectable()
export class ExcludeCampaignMemberUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY) private readonly campaigns: CampaignRepositoryPort,
    @Inject(CAMPAIGN_LIFECYCLE_REPOSITORY)
    private readonly lifecycle: CampaignLifecycleRepositoryPort,
    @Inject(CAMPAIGN_DIRECTORY) private readonly directory: CampaignDirectoryPort,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(
    dto: ExcludeCampaignMemberDto,
    participant: CampaignMutationParticipant,
  ): Promise<CampaignCommandResult> {
    const context = exclusionContext(dto);
    const replay = await replayCampaignLifecycle(this.lifecycle, context);
    if (replay) return replay;
    const command = await this.prepare(context);
    const receipt = await this.lifecycle.exclude(command, participant);
    return acceptedResult(receipt, context.intentHash);
  }

  private async prepare(context: ExclusionContext): Promise<CampaignLifecycleCommand> {
    const { dto, principalId: actorId } = context;
    const campaign = await loadCampaign(this.campaigns, dto.campaignId);
    campaign.assertIsOwner(actorId);
    campaign.assertRevision(dto.expectedRevision);
    const targetId = await resolveMemberId(this.directory, dto.displayName);
    const effectiveRole = campaign.roleOf(actorId);
    const occurredAt = this.clock.now();
    campaign.exclude(actorId, targetId, occurredAt);
    return exclusionCommand({
      context, campaign, targetId, effectiveRole, occurredAt,
    });
  }
}

function exclusionContext(dto: ExcludeCampaignMemberDto): ExclusionContext {
  return {
    dto,
    principalId: UserId.create(dto.actorId),
    idempotencyKey: dto.idempotencyKey,
    intentHash: hashMemberExclusion(dto.campaignId, dto.displayName, dto.expectedRevision),
  };
}

function exclusionCommand(prepared: PreparedExclusion): CampaignLifecycleCommand {
  const { context, campaign, targetId, effectiveRole, occurredAt } = prepared;
  const { dto, principalId, intentHash } = context;
  return {
    campaign, principalId, participantUserId: targetId,
    idempotencyKey: dto.idempotencyKey, intentHash, occurredAt, effectiveRole,
    factType: 'campaign.member-excluded',
    result: toCampaignCommandResult(
      campaign, principalId, { displayName: dto.displayName, userId: targetId },
    ),
  };
}
