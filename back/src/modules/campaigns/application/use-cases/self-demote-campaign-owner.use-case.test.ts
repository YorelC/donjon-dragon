import { randomUUID } from 'crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import { anActor } from '@kernel/testing/actor.fixture';
import { FixedClock } from '@kernel/testing/fixed-clock';
import { UserId } from '@kernel/domain/user-id';

import { CannotSelfDemoteAsLastGameMasterError } from '../../domain/campaign.errors';
import { InMemoryCampaignRepository } from '../../testing/in-memory-campaign.repository';
import { A_CAMPAIGN_NAME } from '../../testing/campaign.fixture';
import { CreateCampaignUseCase } from './create-campaign.use-case';
import { SelfDemoteCampaignOwnerUseCase } from './self-demote-campaign-owner.use-case';

describe('SelfDemoteCampaignOwnerUseCase', () => {
  let campaignRepo: InMemoryCampaignRepository;
  let useCase: SelfDemoteCampaignOwnerUseCase;
  let gandalfId: string;

  beforeEach(async () => {
    campaignRepo = new InMemoryCampaignRepository();
    useCase = new SelfDemoteCampaignOwnerUseCase(campaignRepo, new FixedClock());
    gandalfId = randomUUID();
    await new CreateCampaignUseCase(campaignRepo, new FixedClock()).execute({
      name: A_CAMPAIGN_NAME,
      founderId: anActor(gandalfId),
    });
  });

  it('refuse le dernier maître du jeu, même propriétaire', async () => {
    const [campaign] = await campaignRepo.listActiveForUser(UserId.create(gandalfId));
    await expect(
      useCase.execute({ campaignId: campaign!.id.value, actorId: anActor(gandalfId) }),
    ).rejects.toThrow(CannotSelfDemoteAsLastGameMasterError);
  });
});
