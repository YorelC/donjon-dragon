import { Inject, Injectable } from '@nestjs/common';
import type { CampaignSummary } from '@donjon-dragon/shared/campaign-schema';
import { CLOCK, type Clock } from '@kernel/application/clock.port';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import {
  CAMPAIGN_REPOSITORY,
  type CampaignRepositoryPort,
} from '../ports/campaign.repository.port';
import { Campaign } from '../../domain/campaign';
import { CampaignName } from '../../domain/campaign-name';
import { CampaignCommandConflictError } from '../../domain/campaign.errors';
import { hashCampaignCreation } from '../campaign-intent';
import { creationResultToSummary } from '../campaign.mapper';

export interface CreateCampaignDto {
  name: string;
  founderId: ActorId;
  idempotencyKey: string;
}

@Injectable()
export class CreateCampaignUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepo: CampaignRepositoryPort,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: CreateCampaignDto): Promise<CampaignSummary> {
    const founderId = UserId.create(dto.founderId);
    const occurredAt = this.clock.now();
    const campaign = Campaign.create(CampaignName.create(dto.name), founderId, occurredAt);
    const intentHash = hashCampaignCreation(campaign.name.value);
    const receipt = await this.campaignRepo.create({
      campaign,
      principalId: founderId,
      idempotencyKey: dto.idempotencyKey,
      intentHash,
      occurredAt,
    });
    if (receipt.intentHash !== intentHash) throw new CampaignCommandConflictError();

    return creationResultToSummary(receipt.result, founderId);
  }
}
