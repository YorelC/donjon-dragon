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
import { hashMemberDeparture } from '../campaign-intent';
import { acceptedResult, replayCampaignLifecycle } from '../campaign-lifecycle-replay';
import { UnexpectedSuccessorError } from '../../domain/campaign.errors';

export interface LeaveCampaignDto {
  campaignId: string;
  successorDisplayName?: string;
  expectedRevision: number;
  actorId: ActorId;
  idempotencyKey: string;
}

interface DepartureContext {
  dto: LeaveCampaignDto;
  principalId: UserId;
  idempotencyKey: string;
  intentHash: string;
}

@Injectable()
export class LeaveCampaignUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY) private readonly campaigns: CampaignRepositoryPort,
    @Inject(CAMPAIGN_LIFECYCLE_REPOSITORY)
    private readonly lifecycle: CampaignLifecycleRepositoryPort,
    @Inject(CAMPAIGN_DIRECTORY) private readonly directory: CampaignDirectoryPort,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(
    dto: LeaveCampaignDto,
    participant: CampaignMutationParticipant,
  ): Promise<CampaignCommandResult> {
    const context = departureContext(dto);
    const replay = await replayCampaignLifecycle(this.lifecycle, context);
    if (replay) return replay;
    const command = await this.prepare(context);
    const receipt = await this.lifecycle.leave(command, participant);
    return acceptedResult(receipt, context.intentHash);
  }

  private async prepare(context: DepartureContext): Promise<CampaignLifecycleCommand> {
    const { dto, principalId: actorId, intentHash } = context;
    const campaign = await loadCampaign(this.campaigns, dto.campaignId);
    campaign.assertIsActiveMember(actorId);
    campaign.assertRevision(dto.expectedRevision);
    this.assertSuccessorAllowed(campaign.isOwner(actorId), dto.successorDisplayName);
    const successorId = await this.resolveSuccessor(dto.successorDisplayName);
    const effectiveRole = campaign.roleOf(actorId);
    const occurredAt = this.clock.now();
    campaign.leave(actorId, successorId, occurredAt);
    const target = departureTarget(dto.successorDisplayName, successorId);
    return {
      campaign, principalId: actorId, participantUserId: actorId,
      idempotencyKey: dto.idempotencyKey, intentHash, occurredAt, effectiveRole,
      factType: 'campaign.member-left',
      result: toCampaignCommandResult(campaign, actorId, target),
    };
  }

  private assertSuccessorAllowed(
    isOwner: boolean,
    successorDisplayName: string | undefined,
  ): void {
    if (!isOwner && successorDisplayName) throw new UnexpectedSuccessorError();
  }

  private async resolveSuccessor(displayName: string | undefined): Promise<UserId | null> {
    if (!displayName) return null;
    return resolveMemberId(this.directory, displayName);
  }
}

function departureContext(dto: LeaveCampaignDto): DepartureContext {
  return {
    dto,
    principalId: UserId.create(dto.actorId),
    idempotencyKey: dto.idempotencyKey,
    intentHash: hashMemberDeparture(
      dto.campaignId,
      dto.successorDisplayName ?? null,
      dto.expectedRevision,
    ),
  };
}

function departureTarget(displayName: string | undefined, userId: UserId | null) {
  if (!displayName || !userId) return null;
  return { displayName, userId };
}
