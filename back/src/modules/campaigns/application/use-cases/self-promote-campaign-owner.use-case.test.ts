import { randomUUID } from 'crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import { anActor } from '@kernel/testing/actor.fixture';
import { FixedClock } from '@kernel/testing/fixed-clock';
import { UserId } from '@kernel/domain/user-id';

import { NotCampaignOwnerError } from '../../domain/campaign.errors';
import { InMemoryCampaignRepository } from '../../testing/in-memory-campaign.repository';
import { A_CAMPAIGN_NAME } from '../../testing/campaign.fixture';
import { CreateCampaignUseCase } from './create-campaign.use-case';
import { SelfPromoteCampaignOwnerUseCase } from './self-promote-campaign-owner.use-case';

describe('SelfPromoteCampaignOwnerUseCase', () => {
  let campaignRepo: InMemoryCampaignRepository;
  let useCase: SelfPromoteCampaignOwnerUseCase;
  let gandalfId: string;

  beforeEach(async () => {
    campaignRepo = new InMemoryCampaignRepository();
    useCase = new SelfPromoteCampaignOwnerUseCase(campaignRepo, new FixedClock());
    gandalfId = randomUUID();
    await new CreateCampaignUseCase(campaignRepo, new FixedClock()).execute({
      name: A_CAMPAIGN_NAME,
      founderId: anActor(gandalfId),
    });
  });

  it('refuse un acteur qui n est pas propriétaire', async () => {
    const [campaign] = await campaignRepo.listActiveForUser(UserId.create(gandalfId));
    await expect(
      useCase.execute({ campaignId: campaign!.id.value, actorId: anActor(randomUUID()) }),
    ).rejects.toThrow(NotCampaignOwnerError);
  });
});
