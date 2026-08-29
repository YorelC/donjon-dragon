import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import { UserId } from '@kernel/domain/user-id';
import { TEST_INSTANT } from '@kernel/testing/fixed-clock';

import type { Campaign } from '../../domain/campaign';
import { CampaignNotFoundError } from '../../domain/campaign.errors';
import { aCampaign, withPlayer } from '../../testing/campaign.fixture';
import { InMemoryCampaignRepository } from '../../testing/in-memory-campaign.repository';
import { GetCampaignAudienceUseCase } from './get-campaign-audience.use-case';

/**
 * L'audience diffusée après commit. Le contrat temps réel veut qu'elle soit
 * relue depuis les données autoritaires à chaque émission : une adhésion révolue
 * ne doit plus y figurer, sans quoi un joueur exclu continuerait de recevoir la
 * vie de la table.
 */
describe('GetCampaignAudienceUseCase', () => {
  const ownerId = randomUUID();
  const playerId = randomUUID();
  const excludedId = randomUUID();

  let campaigns: InMemoryCampaignRepository;
  let useCase: GetCampaignAudienceUseCase;
  let campaignId: string;

  beforeEach(async () => {
    campaigns = new InMemoryCampaignRepository();
    useCase = new GetCampaignAudienceUseCase(campaigns);
  });

  async function aTableWith(...playerIds: string[]): Promise<Campaign> {
    const campaign = aCampaign(ownerId);
    playerIds.forEach((id) => withPlayer(campaign, ownerId, id));
    await campaigns.save(campaign);
    campaignId = campaign.id.value;
    return campaign;
  }

  it('rend le fondateur et ses joueurs', async () => {
    await aTableWith(playerId);

    const audience = await useCase.execute(campaignId);

    expect(audience.memberIds).toHaveLength(2);
    expect(audience.memberIds).toEqual(expect.arrayContaining([ownerId, playerId]));
  });

  // Le cas qui motive la relecture : la socket du joueur exclu est peut-être
  // encore ouverte, l'audience ne doit plus le nommer.
  it('exclut une adhésion révolue de l audience', async () => {
    const campaign = await aTableWith(playerId, excludedId);
    campaign.exclude(UserId.create(ownerId), UserId.create(excludedId), TEST_INSTANT);
    await campaigns.save(campaign);

    const audience = await useCase.execute(campaignId);

    expect(audience.memberIds).not.toContain(excludedId);
    expect(audience.memberIds).toEqual(expect.arrayContaining([ownerId, playerId]));
  });

  // Deux audiences distinctes : refuser une invitation ne concerne que les MJ.
  it('ne compte comme MJ que les meneurs actifs', async () => {
    await aTableWith(playerId);

    const audience = await useCase.execute(campaignId);

    expect(audience.gameMasterIds).toEqual([ownerId]);
    expect(audience.gameMasterIds).not.toContain(playerId);
  });

  it('refuse une campagne inconnue plutôt que de diffuser à personne', async () => {
    await expect(useCase.execute(randomUUID())).rejects.toThrow(CampaignNotFoundError);
  });
});
