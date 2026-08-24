import { randomUUID } from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { anActor } from '@kernel/testing/actor.fixture';
import { FixedClock } from '@kernel/testing/fixed-clock';

import { CampaignId } from '../../domain/campaign-id';
import {
  AlreadyCampaignMemberError,
  AlreadyOpenCampaignInvitationError,
  CampaignCommandConflictError,
  InviteeIsNotAFriendError,
  InviteeNotFoundError,
  NotCampaignGameMasterError,
  NotCampaignMemberError,
} from '../../domain/campaign.errors';
import { InMemoryCampaignDirectory } from '../../testing/in-memory-campaign-directory';
import { InMemoryCampaignInvitationRepository } from '../../testing/in-memory-campaign-invitation.repository';
import { InMemoryCampaignRepository } from '../../testing/in-memory-campaign.repository';
import { InMemoryFriendshipChecker } from '../../testing/in-memory-friendship-checker';
import { aCampaign, withPlayer } from '../../testing/campaign.fixture';
import { InviteToCampaignUseCase } from './invite-to-campaign.use-case';

const FRODO = 'Frodon';

describe('InviteToCampaignUseCase', () => {
  let useCase: InviteToCampaignUseCase;
  let campaigns: InMemoryCampaignRepository;
  let invitations: InMemoryCampaignInvitationRepository;
  let directory: InMemoryCampaignDirectory;
  let friendship: InMemoryFriendshipChecker;
  let gandalfId: string;
  let frodoId: string;
  let samId: string;

  beforeEach(() => {
    campaigns = new InMemoryCampaignRepository();
    invitations = new InMemoryCampaignInvitationRepository(campaigns);
    directory = new InMemoryCampaignDirectory();
    friendship = new InMemoryFriendshipChecker();
    useCase = new InviteToCampaignUseCase(
      campaigns,
      invitations,
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
    await campaigns.save(campaign);
    return campaign.id.value;
  }

  function invite(campaignId: string, key: string = randomUUID()) {
    return useCase.execute({
      campaignId,
      displayName: FRODO,
      inviterId: anActor(gandalfId),
      idempotencyKey: key,
    });
  }

  it('crée une invitation ouverte distincte sans adhésion pending', async () => {
    const campaignId = await aStoredCampaign();

    await invite(campaignId);

    expect(invitations.snapshots()).toHaveLength(1);
    expect(invitations.snapshots()[0]).toMatchObject({
      campaignId,
      targetUserId: frodoId,
      invitedByUserId: gandalfId,
      status: 'pending',
    });
    const campaign = await campaigns.findById(CampaignId.create(campaignId));
    expect(campaign?.snapshot().members).toHaveLength(1);
  });

  it('refuse un non-MJ avant toute résolution de pseudo', async () => {
    const campaign = withPlayer(aCampaign(gandalfId), gandalfId, frodoId);
    await campaigns.save(campaign);
    const lookup = vi.spyOn(directory, 'findByDisplayName');

    await expect(
      useCase.execute({
        campaignId: campaign.id.value,
        displayName: 'Inconnu',
        inviterId: anActor(frodoId),
        idempotencyKey: randomUUID(),
      }),
    ).rejects.toThrow(NotCampaignGameMasterError);
    expect(lookup).not.toHaveBeenCalled();
  });

  it('refuse un étranger avant toute résolution de pseudo', async () => {
    const campaignId = await aStoredCampaign();
    const lookup = vi.spyOn(directory, 'findByDisplayName');

    await expect(
      useCase.execute({
        campaignId,
        displayName: 'Inconnu',
        inviterId: anActor(samId),
        idempotencyKey: randomUUID(),
      }),
    ).rejects.toThrow(NotCampaignMemberError);
    expect(lookup).not.toHaveBeenCalled();
  });

  it.each([
    ['pseudo inconnu', 'Inconnu', InviteeNotFoundError],
    ['utilisateur non ami', 'Sam', InviteeIsNotAFriendError],
  ])('refuse une cible invalide : %s', async (_label, displayName, error) => {
    const campaignId = await aStoredCampaign();

    await expect(
      useCase.execute({
        campaignId,
        displayName,
        inviterId: anActor(gandalfId),
        idempotencyKey: randomUUID(),
      }),
    ).rejects.toThrow(error);
  });

  it('refuse une cible déjà membre', async () => {
    const campaign = withPlayer(aCampaign(gandalfId), gandalfId, frodoId);
    await campaigns.save(campaign);

    await expect(invite(campaign.id.value)).rejects.toThrow(AlreadyCampaignMemberError);
  });

  it('refuse une seconde invitation ouverte avec une autre clé', async () => {
    const campaignId = await aStoredCampaign();
    await invite(campaignId);

    await expect(invite(campaignId)).rejects.toThrow(
      AlreadyOpenCampaignInvitationError,
    );
  });

  it('rejoue la même clé et la même intention sans doublon', async () => {
    const campaignId = await aStoredCampaign();
    const key = randomUUID();

    await invite(campaignId, key);
    await invite(campaignId, key);

    expect(invitations.snapshots()).toHaveLength(1);
  });

  it('refuse la même clé avec une autre intention', async () => {
    const campaignId = await aStoredCampaign();
    const key = randomUUID();
    await invite(campaignId, key);

    await expect(
      useCase.execute({
        campaignId,
        displayName: 'Sam',
        inviterId: anActor(gandalfId),
        idempotencyKey: key,
      }),
    ).rejects.toThrow(CampaignCommandConflictError);
    expect(invitations.snapshots()).toHaveLength(1);
  });
});
