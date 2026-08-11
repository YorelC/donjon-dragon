import { randomUUID } from 'crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import { anActor } from '@kernel/testing/actor.fixture';
import { FixedClock, TEST_INSTANT } from '@kernel/testing/fixed-clock';
import { UserId } from '@kernel/domain/user-id';

import { InvalidCampaignNameError } from '../../domain/campaign-name';
import { InMemoryCampaignRepository } from '../../testing/in-memory-campaign.repository';
import { A_CAMPAIGN_NAME } from '../../testing/campaign.fixture';
import { CreateCampaignUseCase } from './create-campaign.use-case';

describe('CreateCampaignUseCase', () => {
  let useCase: CreateCampaignUseCase;
  let campaignRepo: InMemoryCampaignRepository;
  let clock: FixedClock;
  let gandalfId: string;

  beforeEach(() => {
    campaignRepo = new InMemoryCampaignRepository();
    clock = new FixedClock();
    useCase = new CreateCampaignUseCase(campaignRepo, clock);
    gandalfId = randomUUID();
  });

  it('fait du créateur le maître du jeu de sa campagne', async () => {
    const summary = await useCase.execute({
      name: A_CAMPAIGN_NAME,
      founderId: anActor(gandalfId),
    });

    expect(summary.myRole).toBe('gameMaster');
    expect(summary.gameMasterCount).toBe(1);
    expect(summary.playerCount).toBe(0);
    expect(summary.name).toBe(A_CAMPAIGN_NAME);
  });

  it('persiste la campagne, retrouvable par son créateur', async () => {
    const summary = await useCase.execute({
      name: A_CAMPAIGN_NAME,
      founderId: anActor(gandalfId),
    });

    const stored = await campaignRepo.listActiveForUser(UserId.create(gandalfId));

    expect(stored.map((campaign) => campaign.id.value)).toEqual([summary.id]);
  });

  it('date la campagne de l horloge, jamais de l heure réelle', async () => {
    await useCase.execute({ name: A_CAMPAIGN_NAME, founderId: anActor(gandalfId) });

    const [campaign] = await campaignRepo.listActiveForUser(UserId.create(gandalfId));

    expect(campaign?.createdAt).toBe(TEST_INSTANT.toISOString());
  });

  it('refuse un nom hors bornes et ne persiste rien', async () => {
    await expect(
      useCase.execute({ name: 'court', founderId: anActor(gandalfId) }),
    ).rejects.toThrow(InvalidCampaignNameError);

    expect(await campaignRepo.listActiveForUser(UserId.create(gandalfId))).toHaveLength(
      0,
    );
  });

  it('deux campagnes homonymes coexistent, distinguées par leur id', async () => {
    const first = await useCase.execute({
      name: A_CAMPAIGN_NAME,
      founderId: anActor(gandalfId),
    });
    const second = await useCase.execute({
      name: A_CAMPAIGN_NAME,
      founderId: anActor(gandalfId),
    });

    expect(second.id).not.toBe(first.id);
  });
});
