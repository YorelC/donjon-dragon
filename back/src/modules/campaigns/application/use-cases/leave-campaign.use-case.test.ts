import { randomUUID } from 'crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import { anActor } from '@kernel/testing/actor.fixture';
import { FixedClock } from '@kernel/testing/fixed-clock';
import { UserId } from '@kernel/domain/user-id';

import type { Campaign } from '../../domain/campaign';
import { CampaignId } from '../../domain/campaign-id';
import {
  CampaignNotFoundError,
  CannotLeaveAsLastGameMasterError,
  MemberNotFoundError,
  NotCampaignMemberError,
  NotCampaignOwnerError,
  SuccessorRequiredError,
} from '../../domain/campaign.errors';
import { InMemoryCampaignDirectory } from '../../testing/in-memory-campaign-directory';
import { InMemoryCampaignRepository } from '../../testing/in-memory-campaign.repository';
import { aCampaign, withPlayer } from '../../testing/campaign.fixture';
import { DeleteCampaignUseCase } from './delete-campaign.use-case';
import { LeaveCampaignUseCase } from './leave-campaign.use-case';
import { TransferCampaignOwnershipUseCase } from './transfer-campaign-ownership.use-case';

const FRODO = 'Frodon';

describe('propriété et sortie d une campagne', () => {
  let leave: LeaveCampaignUseCase;
  let remove: DeleteCampaignUseCase;
  let transfer: TransferCampaignOwnershipUseCase;
  let campaignRepo: InMemoryCampaignRepository;
  let directory: InMemoryCampaignDirectory;
  let gandalfId: string;
  let frodoId: string;

  beforeEach(() => {
    campaignRepo = new InMemoryCampaignRepository();
    directory = new InMemoryCampaignDirectory();
    const clock = new FixedClock();
    leave = new LeaveCampaignUseCase(campaignRepo, directory, clock);
    remove = new DeleteCampaignUseCase(campaignRepo);
    transfer = new TransferCampaignOwnershipUseCase(campaignRepo, directory, clock);

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

  describe('LeaveCampaignUseCase', () => {
    it('fait sortir le joueur, sans successeur à désigner', async () => {
      const campaign = await withFrodoAsPlayer();

      await leave.execute({
        campaignId: campaign.id.value,
        actorId: anActor(frodoId),
      });

      const saved = await reload(campaign);
      expect(saved?.players()).toHaveLength(0);
    });

    it('exige un successeur quand le propriétaire part', async () => {
      const campaign = await withFrodoAsPlayer();
      await transfer.execute({
        campaignId: campaign.id.value,
        displayName: FRODO,
        actorId: anActor(gandalfId),
      });

      await expect(
        leave.execute({
          campaignId: campaign.id.value,
          actorId: anActor(frodoId),
        }),
      ).rejects.toThrow(SuccessorRequiredError);
    });

    it('passe la main et sort en une seule écriture', async () => {
      const campaign = await withFrodoAsPlayer();
      await transfer.execute({
        campaignId: campaign.id.value,
        displayName: FRODO,
        actorId: anActor(gandalfId),
      });

      await leave.execute({
        campaignId: campaign.id.value,
        successorDisplayName: 'Gandalf',
        actorId: anActor(frodoId),
      });

      const saved = await reload(campaign);
      expect(saved?.ownerId.equals(UserId.create(gandalfId))).toBe(true);
      expect(saved?.players()).toHaveLength(0);
    });

    it('refuse le départ de l unique maître du jeu', async () => {
      const campaign = await withFrodoAsPlayer();

      await expect(
        leave.execute({
          campaignId: campaign.id.value,
          successorDisplayName: FRODO,
          actorId: anActor(gandalfId),
        }),
      ).rejects.toThrow(CannotLeaveAsLastGameMasterError);
    });

    it('refuse un étranger avant de résoudre le moindre pseudo', async () => {
      const campaign = await withFrodoAsPlayer();

      await expect(
        leave.execute({
          campaignId: campaign.id.value,
          successorDisplayName: 'PersonneDeCeNom',
          actorId: anActor(randomUUID()),
        }),
      ).rejects.toThrow(NotCampaignMemberError);
    });

    it('refuse un successeur inconnu de l annuaire', async () => {
      const campaign = await withFrodoAsPlayer();

      await expect(
        leave.execute({
          campaignId: campaign.id.value,
          successorDisplayName: 'PersonneDeCeNom',
          actorId: anActor(frodoId),
        }),
      ).rejects.toThrow(MemberNotFoundError);
    });
  });

  describe('TransferCampaignOwnershipUseCase', () => {
    it('passe la propriété sans toucher au rôle', async () => {
      const campaign = await withFrodoAsPlayer();

      await transfer.execute({
        campaignId: campaign.id.value,
        displayName: FRODO,
        actorId: anActor(gandalfId),
      });

      const saved = await reload(campaign);
      expect(saved?.ownerId.equals(UserId.create(frodoId))).toBe(true);
      expect(saved?.roleOf(UserId.create(frodoId))).toBe('player');
    });

    it('refuse un cédant qui n est pas propriétaire', async () => {
      const campaign = await withFrodoAsPlayer();

      await expect(
        transfer.execute({
          campaignId: campaign.id.value,
          displayName: 'Gandalf',
          actorId: anActor(frodoId),
        }),
      ).rejects.toThrow(NotCampaignOwnerError);
    });
  });

  describe('DeleteCampaignUseCase', () => {
    it('supprime la campagne du propriétaire', async () => {
      const campaign = await withFrodoAsPlayer();

      await remove.execute({
        campaignId: campaign.id.value,
        actorId: anActor(gandalfId),
      });

      expect(await reload(campaign)).toBeNull();
    });

    it('refuse un maître du jeu qui n est pas propriétaire', async () => {
      const campaign = await withFrodoAsPlayer();
      await transfer.execute({
        campaignId: campaign.id.value,
        displayName: FRODO,
        actorId: anActor(gandalfId),
      });

      await expect(
        remove.execute({
          campaignId: campaign.id.value,
          actorId: anActor(gandalfId),
        }),
      ).rejects.toThrow(NotCampaignOwnerError);
      expect(await reload(campaign)).not.toBeNull();
    });

    it('refuse une campagne inconnue', async () => {
      await expect(
        remove.execute({ campaignId: randomUUID(), actorId: anActor(gandalfId) }),
      ).rejects.toThrow(CampaignNotFoundError);
    });
  });
});
