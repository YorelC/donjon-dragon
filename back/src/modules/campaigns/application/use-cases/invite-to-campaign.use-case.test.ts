import { randomUUID } from 'crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import { anActor } from '@kernel/testing/actor.fixture';
import { FixedClock } from '@kernel/testing/fixed-clock';
import { UserId } from '@kernel/domain/user-id';

import { CampaignId } from '../../domain/campaign-id';
import {
  AlreadyCampaignMemberError,
  CampaignNotFoundError,
  InviteeIsNotAFriendError,
  InviteeNotFoundError,
  NotCampaignGameMasterError,
  NotCampaignMemberError,
} from '../../domain/campaign.errors';
import { InMemoryCampaignDirectory } from '../../testing/in-memory-campaign-directory';
import { InMemoryCampaignRepository } from '../../testing/in-memory-campaign.repository';
import { InMemoryFriendshipChecker } from '../../testing/in-memory-friendship-checker';
import { aCampaign, withPlayer } from '../../testing/campaign.fixture';
import { InviteToCampaignUseCase } from './invite-to-campaign.use-case';

const FRODO = 'Frodon';

describe('InviteToCampaignUseCase', () => {
  let useCase: InviteToCampaignUseCase;
  let campaignRepo: InMemoryCampaignRepository;
  let directory: InMemoryCampaignDirectory;
  let friendship: InMemoryFriendshipChecker;
  let gandalfId: string;
  let frodoId: string;
  let samId: string;

  beforeEach(() => {
    campaignRepo = new InMemoryCampaignRepository();
    directory = new InMemoryCampaignDirectory();
    friendship = new InMemoryFriendshipChecker();
    useCase = new InviteToCampaignUseCase(
      campaignRepo,
      directory,
      friendship,
      new FixedClock(),
    );

    gandalfId = randomUUID();
    frodoId = randomUUID();
    samId = randomUUID();
    directory.save({ id: gandalfId, displayName: 'Gandalf' });
    directory.save({ id: frodoId, displayName: FRODO });
    directory.save({ id: samId, displayName: 'Sam' });
    friendship.makeFriends(gandalfId, frodoId);
  });

  async function aStoredCampaign(): Promise<string> {
    const campaign = aCampaign(gandalfId);
    await campaignRepo.save(campaign);
    return campaign.id.value;
  }

  async function pendingInviteesOf(campaignId: string): Promise<string[]> {
    const campaign = await campaignRepo.findById(CampaignId.create(campaignId));
    return (campaign?.pendingInvitees() ?? []).map((userId) => userId.value);
  }

  it('ajoute l ami invité en attente de réponse', async () => {
    const campaignId = await aStoredCampaign();

    await useCase.execute({
      campaignId,
      displayName: FRODO,
      inviterId: anActor(gandalfId),
    });

    expect(await pendingInviteesOf(campaignId)).toEqual([frodoId]);
  });

  it('retient qui a invité, pour que l invité sache d où vient la demande', async () => {
    const campaignId = await aStoredCampaign();

    await useCase.execute({
      campaignId,
      displayName: FRODO,
      inviterId: anActor(gandalfId),
    });

    const campaign = await campaignRepo.findById(CampaignId.create(campaignId));
    const invitation = campaign?.pendingInvitationFor(UserId.create(frodoId));

    expect(invitation?.invitedBy?.value).toBe(gandalfId);
  });

  it('refuse une campagne inconnue', async () => {
    await expect(
      useCase.execute({
        campaignId: randomUUID(),
        displayName: FRODO,
        inviterId: anActor(gandalfId),
      }),
    ).rejects.toThrow(CampaignNotFoundError);
  });

  it('refuse un joueur qui n est pas maître du jeu', async () => {
    const campaign = withPlayer(aCampaign(gandalfId), gandalfId, frodoId);
    await campaignRepo.save(campaign);
    friendship.makeFriends(frodoId, samId);

    await expect(
      useCase.execute({
        campaignId: campaign.id.value,
        displayName: 'Sam',
        inviterId: anActor(frodoId),
      }),
    ).rejects.toThrow(NotCampaignGameMasterError);
  });

  it('refuse un étranger à la campagne', async () => {
    const campaignId = await aStoredCampaign();

    await expect(
      useCase.execute({
        campaignId,
        displayName: FRODO,
        inviterId: anActor(samId),
      }),
    ).rejects.toThrow(NotCampaignMemberError);
  });

  it("ne dit pas à un étranger si un pseudo existe : il est arrêté avant", async () => {
    const campaignId = await aStoredCampaign();

    await expect(
      useCase.execute({
        campaignId,
        displayName: 'PersonneDeCeNom',
        inviterId: anActor(samId),
      }),
    ).rejects.toThrow(NotCampaignMemberError);
  });

  it('refuse un pseudo inconnu', async () => {
    const campaignId = await aStoredCampaign();

    await expect(
      useCase.execute({
        campaignId,
        displayName: 'PersonneDeCeNom',
        inviterId: anActor(gandalfId),
      }),
    ).rejects.toThrow(InviteeNotFoundError);
  });

  it('refuse un utilisateur qui n est pas un ami', async () => {
    const campaignId = await aStoredCampaign();

    await expect(
      useCase.execute({
        campaignId,
        displayName: 'Sam',
        inviterId: anActor(gandalfId),
      }),
    ).rejects.toThrow(InviteeIsNotAFriendError);
  });

  it('refuse d inviter deux fois la même personne', async () => {
    const campaignId = await aStoredCampaign();
    const invite = () =>
      useCase.execute({
        campaignId,
        displayName: FRODO,
        inviterId: anActor(gandalfId),
      });
    await invite();

    await expect(invite()).rejects.toThrow(AlreadyCampaignMemberError);
  });
});
