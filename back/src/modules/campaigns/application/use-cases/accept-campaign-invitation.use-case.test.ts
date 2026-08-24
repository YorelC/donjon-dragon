import { randomUUID } from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { anActor } from '@kernel/testing/actor.fixture';
import { FixedClock, TEST_INSTANT } from '@kernel/testing/fixed-clock';
import { UserId } from '@kernel/domain/user-id';

import { CampaignId } from '../../domain/campaign-id';
import {
  CampaignCommandConflictError,
  NoPendingCampaignInvitationError,
  NotCampaignGameMasterError,
} from '../../domain/campaign.errors';
import { InMemoryCampaignDirectory } from '../../testing/in-memory-campaign-directory';
import { InMemoryCampaignInvitationRepository } from '../../testing/in-memory-campaign-invitation.repository';
import { InMemoryCampaignRepository } from '../../testing/in-memory-campaign.repository';
import { aCampaign, anInvitation, withPlayer } from '../../testing/campaign.fixture';
import { AcceptCampaignInvitationUseCase } from './accept-campaign-invitation.use-case';
import {
  CampaignInvitationCancellationResolver,
  CancelCampaignInvitationUseCase,
} from './cancel-campaign-invitation.use-case';
import { RefuseCampaignInvitationUseCase } from './refuse-campaign-invitation.use-case';

describe('cycle applicatif des invitations de campagne', () => {
  let accept: AcceptCampaignInvitationUseCase;
  let refuse: RefuseCampaignInvitationUseCase;
  let cancel: CancelCampaignInvitationUseCase;
  let campaigns: InMemoryCampaignRepository;
  let invitations: InMemoryCampaignInvitationRepository;
  let directory: InMemoryCampaignDirectory;
  let gandalfId: string;
  let frodoId: string;
  let samId: string;

  beforeEach(() => {
    campaigns = new InMemoryCampaignRepository();
    invitations = new InMemoryCampaignInvitationRepository(campaigns);
    directory = new InMemoryCampaignDirectory();
    const clock = new FixedClock();
    accept = new AcceptCampaignInvitationUseCase(campaigns, invitations, clock);
    refuse = new RefuseCampaignInvitationUseCase(invitations, clock);
    const cancellationResolver = new CampaignInvitationCancellationResolver(
      campaigns,
      invitations,
      directory,
    );
    cancel = new CancelCampaignInvitationUseCase(cancellationResolver, invitations, clock);
    gandalfId = randomUUID();
    frodoId = randomUUID();
    samId = randomUUID();
    directory.save({ id: frodoId, displayName: 'Frodon' });
  });

  async function anOpenInvitation() {
    const campaign = aCampaign(gandalfId);
    const invitation = anInvitation(campaign, gandalfId, frodoId);
    await campaigns.save(campaign);
    await invitations.create({
      invitation,
      principalId: UserId.create(gandalfId),
      idempotencyKey: randomUUID(),
      intentHash: randomUUID(),
      occurredAt: TEST_INSTANT,
      effectiveRole: 'gameMaster',
    });
    return { campaign, invitation };
  }

  it('accepte en créant exactement une adhésion active', async () => {
    const { campaign, invitation } = await anOpenInvitation();

    await accept.execute({
      campaignId: campaign.id.value,
      userId: anActor(frodoId),
      idempotencyKey: randomUUID(),
    });

    const stored = await campaigns.findById(campaign.id);
    expect(stored?.players().map((item) => item.value)).toEqual([frodoId]);
    expect(stored?.snapshot().members).toHaveLength(2);
    expect(invitations.snapshots().find((item) => item.id === invitation.id.value))
      .toMatchObject({ status: 'accepted', revision: 1 });
  });

  it('rejoue une acceptation terminale sans seconde adhésion', async () => {
    const { campaign } = await anOpenInvitation();
    const key = randomUUID();
    const answer = () =>
      accept.execute({
        campaignId: campaign.id.value,
        userId: anActor(frodoId),
        idempotencyKey: key,
      });

    await answer();
    await answer();

    expect((await campaigns.findById(campaign.id))?.players()).toHaveLength(1);
  });

  it('interdit à une autre cible d accepter', async () => {
    const { campaign } = await anOpenInvitation();

    await expect(
      accept.execute({
        campaignId: campaign.id.value,
        userId: anActor(samId),
        idempotencyKey: randomUUID(),
      }),
    ).rejects.toThrow(NoPendingCampaignInvitationError);
  });

  it('interdit une seconde réponse avec une nouvelle clé', async () => {
    const { campaign } = await anOpenInvitation();
    await refuse.execute({
      campaignId: campaign.id.value,
      userId: anActor(frodoId),
      idempotencyKey: randomUUID(),
    });

    await expect(
      accept.execute({
        campaignId: campaign.id.value,
        userId: anActor(frodoId),
        idempotencyKey: randomUUID(),
      }),
    ).rejects.toThrow(NoPendingCampaignInvitationError);
  });

  it('refuse sans créer d adhésion et conserve le terminal', async () => {
    const { campaign, invitation } = await anOpenInvitation();

    await refuse.execute({
      campaignId: campaign.id.value,
      userId: anActor(frodoId),
      idempotencyKey: randomUUID(),
    });

    expect((await campaigns.findById(campaign.id))?.snapshot().members).toHaveLength(1);
    expect(invitations.snapshots().find((item) => item.id === invitation.id.value))
      .toMatchObject({ status: 'refused' });
  });

  it('annule par un MJ actif sans créer d adhésion', async () => {
    const { campaign, invitation } = await anOpenInvitation();

    await cancel.execute({
      campaignId: campaign.id.value,
      displayName: 'Frodon',
      actorId: anActor(gandalfId),
      idempotencyKey: randomUUID(),
    });

    expect((await campaigns.findById(campaign.id))?.snapshot().members).toHaveLength(1);
    expect(invitations.snapshots().find((item) => item.id === invitation.id.value))
      .toMatchObject({ status: 'cancelled' });
  });

  it('refuse l annulation par un non-MJ avant l annuaire', async () => {
    const campaign = withPlayer(aCampaign(gandalfId), gandalfId, frodoId);
    await campaigns.save(campaign);
    const lookup = vi.spyOn(directory, 'findByDisplayName');

    await expect(
      cancel.execute({
        campaignId: campaign.id.value,
        displayName: 'Inconnu',
        actorId: anActor(frodoId),
        idempotencyKey: randomUUID(),
      }),
    ).rejects.toThrow(NotCampaignGameMasterError);
    expect(lookup).not.toHaveBeenCalled();
  });

  it('refuse une clé réutilisée pour une autre réponse', async () => {
    const { campaign } = await anOpenInvitation();
    const key = randomUUID();
    await refuse.execute({
      campaignId: campaign.id.value,
      userId: anActor(frodoId),
      idempotencyKey: key,
    });

    await expect(
      accept.execute({
        campaignId: campaign.id.value,
        userId: anActor(frodoId),
        idempotencyKey: key,
      }),
    ).rejects.toThrow(CampaignCommandConflictError);
  });

  it('autorise un nouveau cycle après un terminal', async () => {
    const { campaign } = await anOpenInvitation();
    await refuse.execute({
      campaignId: campaign.id.value,
      userId: anActor(frodoId),
      idempotencyKey: randomUUID(),
    });
    const second = anInvitation(campaign, gandalfId, frodoId);

    await invitations.create({
      invitation: second,
      principalId: UserId.create(gandalfId),
      idempotencyKey: randomUUID(),
      intentHash: randomUUID(),
      occurredAt: TEST_INSTANT,
      effectiveRole: 'gameMaster',
    });

    expect(invitations.snapshots()).toHaveLength(2);
    expect(await invitations.findOpen(CampaignId.create(campaign.id.value), UserId.create(frodoId)))
      .not.toBeNull();
  });
});
