import { randomUUID } from 'crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import { anActor } from '@kernel/testing/actor.fixture';
import { FixedClock } from '@kernel/testing/fixed-clock';
import { UserId } from '@kernel/domain/user-id';

import { CampaignId } from '../../domain/campaign-id';
import type { Campaign } from '../../domain/campaign';
import {
  CampaignNotFoundError,
  CannotRemoveOwnerError,
  CannotRemoveSelfError,
  MemberNotFoundError,
  NotCampaignGameMasterError,
  NotCampaignMemberError,
} from '../../domain/campaign.errors';
import { InMemoryCampaignDirectory } from '../../testing/in-memory-campaign-directory';
import { InMemoryCampaignRepository } from '../../testing/in-memory-campaign.repository';
import {
  aCampaign,
  withPendingInvitee,
  withPlayer,
} from '../../testing/campaign.fixture';
import { DemoteCampaignMemberUseCase } from './demote-campaign-member.use-case';
import { PromoteCampaignMemberUseCase } from './promote-campaign-member.use-case';
import { RemoveCampaignMemberUseCase } from './remove-campaign-member.use-case';

const FRODO = 'Frodon';

describe('gestion des membres d une campagne', () => {
  let promote: PromoteCampaignMemberUseCase;
  let demote: DemoteCampaignMemberUseCase;
  let remove: RemoveCampaignMemberUseCase;
  let campaignRepo: InMemoryCampaignRepository;
  let directory: InMemoryCampaignDirectory;
  let gandalfId: string;
  let frodoId: string;

  beforeEach(() => {
    campaignRepo = new InMemoryCampaignRepository();
    directory = new InMemoryCampaignDirectory();
    const clock = new FixedClock();
    promote = new PromoteCampaignMemberUseCase(campaignRepo, directory, clock);
    demote = new DemoteCampaignMemberUseCase(campaignRepo, directory, clock);
    remove = new RemoveCampaignMemberUseCase(campaignRepo, directory, clock);

    gandalfId = randomUUID();
    frodoId = randomUUID();
    directory.save({ id: gandalfId, displayName: 'Gandalf' });
    directory.save({ id: frodoId, displayName: FRODO });
  });

  async function withFrodoAsPlayer(): Promise<Campaign> {
    const campaign = withPlayer(aCampaign(gandalfId), gandalfId, frodoId);
    await campaignRepo.save(campaign);
    return campaign;
  }

  async function reload(campaign: Campaign): Promise<Campaign | null> {
    return campaignRepo.findById(CampaignId.create(campaign.id.value));
  }

  describe('PromoteCampaignMemberUseCase', () => {
    it('promeut le joueur désigné par son pseudo', async () => {
      const campaign = await withFrodoAsPlayer();

      await promote.execute({
        campaignId: campaign.id.value,
        displayName: FRODO,
        actorId: anActor(gandalfId),
      });

      const saved = await reload(campaign);
      expect(saved?.roleOf(UserId.create(frodoId))).toBe('gameMaster');
    });

    it('refuse un demandeur qui n est pas maître du jeu', async () => {
      const campaign = await withFrodoAsPlayer();

      await expect(
        promote.execute({
          campaignId: campaign.id.value,
          displayName: 'Gandalf',
          actorId: anActor(frodoId),
        }),
      ).rejects.toThrow(NotCampaignGameMasterError);
    });

    it("n'indique pas à un étranger si un pseudo existe : il est arrêté avant", async () => {
      const campaign = await withFrodoAsPlayer();

      await expect(
        promote.execute({
          campaignId: campaign.id.value,
          displayName: 'PersonneDeCeNom',
          actorId: anActor(randomUUID()),
        }),
      ).rejects.toThrow(NotCampaignMemberError);
    });

    it('refuse un pseudo inconnu de l annuaire', async () => {
      const campaign = await withFrodoAsPlayer();

      await expect(
        promote.execute({
          campaignId: campaign.id.value,
          displayName: 'PersonneDeCeNom',
          actorId: anActor(gandalfId),
        }),
      ).rejects.toThrow(MemberNotFoundError);
    });

    it('refuse une campagne inconnue', async () => {
      await expect(
        promote.execute({
          campaignId: randomUUID(),
          displayName: FRODO,
          actorId: anActor(gandalfId),
        }),
      ).rejects.toThrow(CampaignNotFoundError);
    });
  });

  describe('DemoteCampaignMemberUseCase', () => {
    it('ramène le maître du jeu au rang de joueur', async () => {
      const campaign = await withFrodoAsPlayer();
      await promote.execute({
        campaignId: campaign.id.value,
        displayName: FRODO,
        actorId: anActor(gandalfId),
      });

      await demote.execute({
        campaignId: campaign.id.value,
        displayName: FRODO,
        actorId: anActor(gandalfId),
      });

      const saved = await reload(campaign);
      expect(saved?.roleOf(UserId.create(frodoId))).toBe('player');
    });
  });

  describe('RemoveCampaignMemberUseCase', () => {
    it('retire le joueur de la campagne', async () => {
      const campaign = await withFrodoAsPlayer();

      await remove.execute({
        campaignId: campaign.id.value,
        displayName: FRODO,
        actorId: anActor(gandalfId),
      });

      const saved = await reload(campaign);
      expect(saved?.players()).toHaveLength(0);
    });

    it('annule une invitation encore sans réponse', async () => {
      const campaign = withPendingInvitee(aCampaign(gandalfId), gandalfId, frodoId);
      await campaignRepo.save(campaign);

      await remove.execute({
        campaignId: campaign.id.value,
        displayName: FRODO,
        actorId: anActor(gandalfId),
      });

      const saved = await reload(campaign);
      expect(saved?.pendingInvitees()).toHaveLength(0);
    });

    it('refuse de retirer le propriétaire', async () => {
      const campaign = await withFrodoAsPlayer();
      await promote.execute({
        campaignId: campaign.id.value,
        displayName: FRODO,
        actorId: anActor(gandalfId),
      });

      await expect(
        remove.execute({
          campaignId: campaign.id.value,
          displayName: 'Gandalf',
          actorId: anActor(frodoId),
        }),
      ).rejects.toThrow(CannotRemoveOwnerError);
    });

    it('refuse de se retirer soi-même', async () => {
      const campaign = await withFrodoAsPlayer();

      await expect(
        remove.execute({
          campaignId: campaign.id.value,
          displayName: 'Gandalf',
          actorId: anActor(gandalfId),
        }),
      ).rejects.toThrow(CannotRemoveSelfError);
    });
  });
});
