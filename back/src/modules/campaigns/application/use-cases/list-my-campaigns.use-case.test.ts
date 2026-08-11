import { randomUUID } from 'crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import { anActor } from '@kernel/testing/actor.fixture';

import { InMemoryCampaignRepository } from '../../testing/in-memory-campaign.repository';
import {
  aCampaign,
  withPendingInvitee,
  withPlayer,
} from '../../testing/campaign.fixture';
import { ListMyCampaignsUseCase } from './list-my-campaigns.use-case';

describe('ListMyCampaignsUseCase', () => {
  let useCase: ListMyCampaignsUseCase;
  let campaignRepo: InMemoryCampaignRepository;
  let gandalfId: string;
  let frodoId: string;

  beforeEach(() => {
    campaignRepo = new InMemoryCampaignRepository();
    useCase = new ListMyCampaignsUseCase(campaignRepo);
    gandalfId = randomUUID();
    frodoId = randomUUID();
  });

  it('rend les campagnes dont je suis membre actif', async () => {
    await campaignRepo.save(aCampaign(gandalfId));

    const campaigns = await useCase.execute({ userId: anActor(gandalfId) });

    expect(campaigns.map((campaign) => campaign.myRole)).toEqual(['gameMaster']);
  });

  it('ignore les campagnes des autres', async () => {
    await campaignRepo.save(aCampaign(gandalfId));

    expect(await useCase.execute({ userId: anActor(frodoId) })).toHaveLength(0);
  });

  it('ignore une campagne où je suis seulement invité', async () => {
    await campaignRepo.save(withPendingInvitee(aCampaign(gandalfId), gandalfId, frodoId));

    expect(await useCase.execute({ userId: anActor(frodoId) })).toHaveLength(0);
  });

  it('rend le rôle du LECTEUR, pas celui du créateur', async () => {
    await campaignRepo.save(withPlayer(aCampaign(gandalfId), gandalfId, frodoId));

    const [campaign] = await useCase.execute({ userId: anActor(frodoId) });

    expect(campaign?.myRole).toBe('player');
  });

  it('compte séparément maîtres du jeu et joueurs actifs', async () => {
    const campaign = withPendingInvitee(
      withPlayer(aCampaign(gandalfId), gandalfId, frodoId),
      gandalfId,
      randomUUID(),
    );
    await campaignRepo.save(campaign);

    const [summary] = await useCase.execute({ userId: anActor(gandalfId) });

    expect(summary?.gameMasterCount).toBe(1);
    expect(summary?.playerCount).toBe(1);
  });
});
