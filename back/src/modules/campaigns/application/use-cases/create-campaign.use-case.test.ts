import { randomUUID } from 'crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import { anActor } from '@kernel/testing/actor.fixture';
import { FixedClock, TEST_INSTANT } from '@kernel/testing/fixed-clock';
import { UserId } from '@kernel/domain/user-id';

import { CampaignCommandConflictError } from '../../domain/campaign.errors';
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

  const create = (name: string = A_CAMPAIGN_NAME, idempotencyKey = randomUUID()) =>
    useCase.execute({ name, founderId: anActor(gandalfId), idempotencyKey });

  it('fait du créateur le maître du jeu de sa campagne', async () => {
    const summary = await create();

    expect(summary.myRole).toBe('gameMaster');
    expect(summary.isOwner).toBe(true);
    expect(summary.gameMasterCount).toBe(1);
    expect(summary.playerCount).toBe(0);
    expect(summary.name).toBe(A_CAMPAIGN_NAME);
  });

  it('persiste la campagne, retrouvable par son créateur', async () => {
    const summary = await create();

    const stored = await campaignRepo.listActiveForUser(UserId.create(gandalfId));

    expect(stored.map((campaign) => campaign.id.value)).toEqual([summary.id]);
  });

  it('date la campagne de l horloge, jamais de l heure réelle', async () => {
    await create();

    const [campaign] = await campaignRepo.listActiveForUser(UserId.create(gandalfId));

    expect(campaign?.createdAt).toBe(TEST_INSTANT.toISOString());
  });

  it('refuse un nom hors bornes et ne persiste rien', async () => {
    await expect(
      create('court'),
    ).rejects.toThrow(InvalidCampaignNameError);

    expect(await campaignRepo.listActiveForUser(UserId.create(gandalfId))).toHaveLength(
      0,
    );
  });

  it('deux campagnes homonymes coexistent, distinguées par leur id', async () => {
    const first = await create();
    const second = await create();

    expect(second.id).not.toBe(first.id);
  });

  it('rejoue une même intention sans créer une seconde campagne', async () => {
    const idempotencyKey = randomUUID();

    const first = await create(A_CAMPAIGN_NAME, idempotencyKey);
    const replay = await create(` ${A_CAMPAIGN_NAME} `, idempotencyKey);

    expect(replay).toEqual(first);
    expect(await campaignRepo.listActiveForUser(UserId.create(gandalfId))).toHaveLength(
      1,
    );
  });

  it('refuse de réutiliser une clé pour une autre intention', async () => {
    const idempotencyKey = randomUUID();
    await create(A_CAMPAIGN_NAME, idempotencyKey);

    await expect(create('Les Brumes de Ravenloft', idempotencyKey)).rejects.toThrow(
      CampaignCommandConflictError,
    );
  });
});
