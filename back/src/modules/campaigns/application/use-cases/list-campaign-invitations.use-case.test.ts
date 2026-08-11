import { randomUUID } from 'crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import { anActor } from '@kernel/testing/actor.fixture';

import { InMemoryCampaignDirectory } from '../../testing/in-memory-campaign-directory';
import { InMemoryCampaignRepository } from '../../testing/in-memory-campaign.repository';
import {
  A_CAMPAIGN_NAME,
  aCampaign,
  withPendingInvitee,
  withPlayer,
} from '../../testing/campaign.fixture';
import { CountCampaignInvitationsUseCase } from './count-campaign-invitations.use-case';
import { ListCampaignInvitationsUseCase } from './list-campaign-invitations.use-case';

describe('demandes de campagne reçues', () => {
  let list: ListCampaignInvitationsUseCase;
  let count: CountCampaignInvitationsUseCase;
  let campaignRepo: InMemoryCampaignRepository;
  let directory: InMemoryCampaignDirectory;
  let gandalfId: string;
  let frodoId: string;

  beforeEach(() => {
    campaignRepo = new InMemoryCampaignRepository();
    directory = new InMemoryCampaignDirectory();
    list = new ListCampaignInvitationsUseCase(campaignRepo, directory);
    count = new CountCampaignInvitationsUseCase(campaignRepo);
    gandalfId = randomUUID();
    frodoId = randomUUID();
    directory.save({ id: gandalfId, displayName: 'Gandalf' });
    directory.save({ id: frodoId, displayName: 'Frodon' });
  });

  it('rend la campagne et l ami qui a invité', async () => {
    const campaign = withPendingInvitee(aCampaign(gandalfId), gandalfId, frodoId);
    await campaignRepo.save(campaign);

    const invitations = await list.execute({ userId: anActor(frodoId) });

    expect(invitations).toEqual([
      {
        campaignId: campaign.id.value,
        name: A_CAMPAIGN_NAME,
        invitedBy: { displayName: 'Gandalf' },
      },
    ]);
  });

  it('ne laisse fuir aucun identifiant d utilisateur', async () => {
    await campaignRepo.save(
      withPendingInvitee(aCampaign(gandalfId), gandalfId, frodoId),
    );

    const invitations = await list.execute({ userId: anActor(frodoId) });

    expect(JSON.stringify(invitations)).not.toContain(gandalfId);
    expect(JSON.stringify(invitations)).not.toContain(frodoId);
  });

  it('ignore les campagnes dont je suis déjà membre actif', async () => {
    await campaignRepo.save(withPlayer(aCampaign(gandalfId), gandalfId, frodoId));

    expect(await list.execute({ userId: anActor(frodoId) })).toHaveLength(0);
  });

  it('ignore les invitations envoyées à quelqu un d autre', async () => {
    await campaignRepo.save(
      withPendingInvitee(aCampaign(gandalfId), gandalfId, randomUUID()),
    );

    expect(await list.execute({ userId: anActor(frodoId) })).toHaveLength(0);
  });

  it('masque une invitation dont l inviteur a disparu de l annuaire', async () => {
    const orphanId = randomUUID();
    await campaignRepo.save(
      withPendingInvitee(aCampaign(orphanId), orphanId, frodoId),
    );

    expect(await list.execute({ userId: anActor(frodoId) })).toHaveLength(0);
  });

  it('compte les invitations en attente', async () => {
    await campaignRepo.save(
      withPendingInvitee(aCampaign(gandalfId), gandalfId, frodoId),
    );
    await campaignRepo.save(
      withPendingInvitee(aCampaign(gandalfId), gandalfId, frodoId),
    );

    expect(await count.execute({ userId: anActor(frodoId) })).toEqual({ count: 2 });
  });

  it('compte zéro quand il n y a rien', async () => {
    expect(await count.execute({ userId: anActor(frodoId) })).toEqual({ count: 0 });
  });

  it('compte même les invitations dont l inviteur a disparu', async () => {
    // Le compteur ne résout pas les inviteurs : il ne peut donc pas les masquer
    // comme la liste. Divergence assumée — un badge à 1 pour une liste vide vaut
    // mieux que payer N lectures d'annuaire à chaque rafraîchissement.
    const orphanId = randomUUID();
    await campaignRepo.save(
      withPendingInvitee(aCampaign(orphanId), orphanId, frodoId),
    );

    expect(await count.execute({ userId: anActor(frodoId) })).toEqual({ count: 1 });
  });
});
