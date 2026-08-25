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
import { hashOwnershipTransfer } from '../campaign-intent';
import { acceptedResult, replayCampaignLifecycle } from '../campaign-lifecycle-replay';

export interface TransferCampaignOwnershipDto {
  campaignId: string;
  displayName: string;
  expectedRevision: number;
  actorId: ActorId;
  idempotencyKey: string;
}

interface TransferContext {
  dto: TransferCampaignOwnershipDto;
  principalId: UserId;
  idempotencyKey: string;
  intentHash: string;
}

@Injectable()
export class TransferCampaignOwnershipUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY) private readonly campaigns: CampaignRepositoryPort,
    @Inject(CAMPAIGN_LIFECYCLE_REPOSITORY)
    private readonly lifecycle: CampaignLifecycleRepositoryPort,
    @Inject(CAMPAIGN_DIRECTORY) private readonly directory: CampaignDirectoryPort,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: TransferCampaignOwnershipDto): Promise<CampaignCommandResult> {
    const context = transferContext(dto);
    const replay = await replayCampaignLifecycle(this.lifecycle, context);
    if (replay) return replay;
    const command = await this.prepare(context);
    const receipt = await this.lifecycle.transfer(command);
    return acceptedResult(receipt, context.intentHash);
  }

  private async prepare(context: TransferContext): Promise<CampaignLifecycleCommand> {
    const { dto, principalId: actorId, intentHash } = context;
    const campaign = await loadCampaign(this.campaigns, dto.campaignId);
    campaign.assertIsOwner(actorId);
    campaign.assertRevision(dto.expectedRevision);
    const targetId = await resolveMemberId(this.directory, dto.displayName);
    const effectiveRole = campaign.roleOf(actorId);
    const occurredAt = this.clock.now();
    campaign.transferOwnership(actorId, targetId, occurredAt);
    return {
      campaign, principalId: actorId, participantUserId: targetId,
      idempotencyKey: dto.idempotencyKey, intentHash, occurredAt, effectiveRole,
      factType: 'campaign.ownership-transferred',
      result: toCampaignCommandResult(
        campaign, actorId, { displayName: dto.displayName, userId: targetId },
      ),
    };
  }
}

function transferContext(dto: TransferCampaignOwnershipDto): TransferContext {
  return {
    dto,
    principalId: UserId.create(dto.actorId),
    idempotencyKey: dto.idempotencyKey,
    intentHash: hashOwnershipTransfer(dto.campaignId, dto.displayName, dto.expectedRevision),
  };
}
