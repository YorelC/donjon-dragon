import { randomUUID } from 'crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import { anActor } from '@kernel/testing/actor.fixture';
import { UserId } from '@kernel/domain/user-id';

import {
  CampaignNotFoundError,
  NotCampaignMemberError,
} from '../../domain/campaign.errors';
import { InMemoryCampaignDirectory } from '../../testing/in-memory-campaign-directory';
import { InMemoryCampaignRepository } from '../../testing/in-memory-campaign.repository';
import {
  A_CAMPAIGN_NAME,
  aCampaign,
  withPendingInvitee,
  withPlayer,
} from '../../testing/campaign.fixture';
import { GetCampaignDetailUseCase } from './get-campaign-detail.use-case';

describe('GetCampaignDetailUseCase', () => {
  let useCase: GetCampaignDetailUseCase;
  let campaignRepo: InMemoryCampaignRepository;
  let directory: InMemoryCampaignDirectory;
  let gandalfId: string;
  let frodoId: string;
  let samId: string;

  beforeEach(() => {
    campaignRepo = new InMemoryCampaignRepository();
    directory = new InMemoryCampaignDirectory();
    useCase = new GetCampaignDetailUseCase(campaignRepo, directory);
    gandalfId = randomUUID();
    frodoId = randomUUID();
    samId = randomUUID();
    directory.save({ id: gandalfId, displayName: 'Gandalf' });
    directory.save({ id: frodoId, displayName: 'Frodon' });
    directory.save({ id: samId, displayName: 'Sam' });
  });

  async function aFullCampaign() {
    const campaign = withPendingInvitee(
      withPlayer(aCampaign(gandalfId), gandalfId, frodoId),
      gandalfId,
      samId,
    );
    await campaignRepo.save(campaign);
    return campaign;
  }

  it('sépare maîtres du jeu, joueurs et invitations en attente', async () => {
    const campaign = await aFullCampaign();

    const detail = await useCase.execute({
      campaignId: campaign.id.value,
      userId: anActor(gandalfId),
    });

    expect(detail.name).toBe(A_CAMPAIGN_NAME);
    expect(detail.gameMasters).toEqual([{ displayName: 'Gandalf' }]);
    expect(detail.players).toEqual([{ displayName: 'Frodon' }]);
    expect(detail.pendingInvitees).toEqual([{ displayName: 'Sam' }]);
  });

  it('désigne le propriétaire et dit au lecteur s il l est', async () => {
    const campaign = await aFullCampaign();

    const detail = await useCase.execute({
      campaignId: campaign.id.value,
      userId: anActor(gandalfId),
    });

    expect(detail.owner).toEqual({ displayName: 'Gandalf' });
    expect(detail.isOwner).toBe(true);
  });

  it('dit au joueur qu il n est pas propriétaire, sans lui cacher qui l est', async () => {
    const campaign = await aFullCampaign();

    const detail = await useCase.execute({
      campaignId: campaign.id.value,
      userId: anActor(frodoId),
    });

    expect(detail.isOwner).toBe(false);
    expect(detail.owner).toEqual({ displayName: 'Gandalf' });
    expect(detail.myRole).toBe('player');
  });

  it('reste juste quand le propriétaire n est que joueur', async () => {
    const campaign = await aFullCampaign();
    campaign.transferOwnership(
      UserId.create(gandalfId),
      UserId.create(frodoId),
      new Date(),
    );

    const detail = await useCase.execute({
      campaignId: campaign.id.value,
      userId: anActor(frodoId),
    });

    expect(detail.isOwner).toBe(true);
    expect(detail.myRole).toBe('player');
  });

  it('ne laisse fuir aucun identifiant d utilisateur', async () => {
    const campaign = await aFullCampaign();

    const detail = await useCase.execute({
      campaignId: campaign.id.value,
      userId: anActor(gandalfId),
    });

    expect(JSON.stringify(detail)).not.toContain(gandalfId);
    expect(JSON.stringify(detail)).not.toContain(frodoId);
  });

  it('refuse une campagne inconnue', async () => {
    await expect(
      useCase.execute({ campaignId: randomUUID(), userId: anActor(gandalfId) }),
    ).rejects.toThrow(CampaignNotFoundError);
  });

  it('refuse un étranger : « pas à toi », et non « pas trouvé »', async () => {
    const campaign = await aFullCampaign();

    await expect(
      useCase.execute({
        campaignId: campaign.id.value,
        userId: anActor(randomUUID()),
      }),
    ).rejects.toThrow(NotCampaignMemberError);
  });

  it('refuse un invité qui n a pas encore répondu', async () => {
    const campaign = await aFullCampaign();

    await expect(
      useCase.execute({ campaignId: campaign.id.value, userId: anActor(samId) }),
    ).rejects.toThrow(NotCampaignMemberError);
  });

  it('garde sa place à un membre absent de l annuaire, sans fausser la liste', async () => {
    const ghostId = randomUUID();
    const campaign = withPlayer(aCampaign(gandalfId), gandalfId, ghostId);
    await campaignRepo.save(campaign);

    const detail = await useCase.execute({
      campaignId: campaign.id.value,
      userId: anActor(gandalfId),
    });

    expect(detail.players).toHaveLength(1);
    expect(detail.players[0]?.displayName).toBe('Compte introuvable');
  });
});
