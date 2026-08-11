import { randomUUID } from 'crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import { anActor } from '@kernel/testing/actor.fixture';
import { FixedClock } from '@kernel/testing/fixed-clock';
import { UserId } from '@kernel/domain/user-id';

import type { Campaign } from '../../domain/campaign';
import {
  CampaignNotFoundError,
  NoPendingCampaignInvitationError,
} from '../../domain/campaign.errors';
import { InMemoryCampaignRepository } from '../../testing/in-memory-campaign.repository';
import { aCampaign, withPendingInvitee } from '../../testing/campaign.fixture';
import { AcceptCampaignInvitationUseCase } from './accept-campaign-invitation.use-case';
import { RefuseCampaignInvitationUseCase } from './refuse-campaign-invitation.use-case';

describe('réponse à une invitation de campagne', () => {
  let accept: AcceptCampaignInvitationUseCase;
  let refuse: RefuseCampaignInvitationUseCase;
  let campaignRepo: InMemoryCampaignRepository;
  let gandalfId: string;
  let frodoId: string;
  let samId: string;

  beforeEach(() => {
    campaignRepo = new InMemoryCampaignRepository();
    accept = new AcceptCampaignInvitationUseCase(campaignRepo, new FixedClock());
    refuse = new RefuseCampaignInvitationUseCase(campaignRepo, new FixedClock());
    gandalfId = randomUUID();
    frodoId = randomUUID();
    samId = randomUUID();
  });

  async function anInvitation(): Promise<Campaign> {
    const campaign = withPendingInvitee(aCampaign(gandalfId), gandalfId, frodoId);
    await campaignRepo.save(campaign);
    return campaign;
  }

  describe('AcceptCampaignInvitationUseCase', () => {
    it('fait entrer l invité comme joueur de la campagne', async () => {
      const campaign = await anInvitation();

      await accept.execute({
        campaignId: campaign.id.value,
        userId: anActor(frodoId),
      });

      expect(campaign.players().map((id) => id.value)).toEqual([frodoId]);
      expect(campaign.pendingInvitees()).toHaveLength(0);
    });

    it('sort la campagne de mes demandes et la met dans mes campagnes', async () => {
      const campaign = await anInvitation();
      const frodo = UserId.create(frodoId);

      await accept.execute({
        campaignId: campaign.id.value,
        userId: anActor(frodoId),
      });

      expect(await campaignRepo.listPendingForUser(frodo)).toHaveLength(0);
      expect(await campaignRepo.listActiveForUser(frodo)).toHaveLength(1);
    });

    it('refuse une campagne inconnue', async () => {
      await expect(
        accept.execute({ campaignId: randomUUID(), userId: anActor(frodoId) }),
      ).rejects.toThrow(CampaignNotFoundError);
    });

    it('refuse quelqu un qui n a pas d invitation', async () => {
      const campaign = await anInvitation();

      await expect(
        accept.execute({ campaignId: campaign.id.value, userId: anActor(samId) }),
      ).rejects.toThrow(NoPendingCampaignInvitationError);
    });

    it('refuse une seconde acceptation', async () => {
      const campaign = await anInvitation();
      const answer = () =>
        accept.execute({ campaignId: campaign.id.value, userId: anActor(frodoId) });
      await answer();

      await expect(answer()).rejects.toThrow(NoPendingCampaignInvitationError);
    });
  });

  describe('RefuseCampaignInvitationUseCase', () => {
    it('ne laisse rien : l invité redevient inconnu de la campagne', async () => {
      const campaign = await anInvitation();

      await refuse.execute({
        campaignId: campaign.id.value,
        userId: anActor(frodoId),
      });

      expect(campaign.snapshot().members).toHaveLength(1);
      expect(await campaignRepo.listPendingForUser(UserId.create(frodoId))).toHaveLength(
        0,
      );
    });

    it('ne fait pas entrer le refusant dans la campagne', async () => {
      const campaign = await anInvitation();

      await refuse.execute({
        campaignId: campaign.id.value,
        userId: anActor(frodoId),
      });

      expect(await campaignRepo.listActiveForUser(UserId.create(frodoId))).toHaveLength(
        0,
      );
    });

    it('refuse une campagne inconnue', async () => {
      await expect(
        refuse.execute({ campaignId: randomUUID(), userId: anActor(frodoId) }),
      ).rejects.toThrow(CampaignNotFoundError);
    });

    it('refuse quelqu un qui n a pas d invitation', async () => {
      const campaign = await anInvitation();

      await expect(
        refuse.execute({ campaignId: campaign.id.value, userId: anActor(samId) }),
      ).rejects.toThrow(NoPendingCampaignInvitationError);
    });
  });
});
