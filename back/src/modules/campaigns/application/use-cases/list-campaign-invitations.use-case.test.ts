import { randomUUID } from 'crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { anActor } from '@kernel/testing/actor.fixture';
import { TEST_INSTANT } from '@kernel/testing/fixed-clock';
import { UserId } from '@kernel/domain/user-id';

import { InMemoryCampaignDirectory } from '../../testing/in-memory-campaign-directory';
import { InMemoryCampaignInvitationRepository } from '../../testing/in-memory-campaign-invitation.repository';
import { InMemoryCampaignRepository } from '../../testing/in-memory-campaign.repository';
import { A_CAMPAIGN_NAME, aCampaign, anInvitation } from '../../testing/campaign.fixture';
import { CountCampaignInvitationsUseCase } from './count-campaign-invitations.use-case';
import { ListCampaignInvitationsUseCase } from './list-campaign-invitations.use-case';

describe('lectures des invitations ouvertes', () => {
  let list: ListCampaignInvitationsUseCase;
  let count: CountCampaignInvitationsUseCase;
  let campaigns: InMemoryCampaignRepository;
  let invitations: InMemoryCampaignInvitationRepository;
  let directory: InMemoryCampaignDirectory;
  let gandalfId: string;
  let frodoId: string;

  beforeEach(() => {
    campaigns = new InMemoryCampaignRepository();
    invitations = new InMemoryCampaignInvitationRepository(campaigns);
    directory = new InMemoryCampaignDirectory();
    list = new ListCampaignInvitationsUseCase(campaigns, invitations, directory);
    count = new CountCampaignInvitationsUseCase(invitations);
    gandalfId = randomUUID();
    frodoId = randomUUID();
    directory.save({ id: gandalfId, displayName: 'Gandalf' });
  });

  async function storeOpenInvitation() {
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

  it('rend la campagne et l ami qui a invité sans identifiant utilisateur', async () => {
    const { campaign } = await storeOpenInvitation();

    const result = await list.execute({ userId: anActor(frodoId) });

    expect(result).toEqual([
      {
        campaignId: campaign.id.value,
        name: A_CAMPAIGN_NAME,
        invitedBy: { displayName: 'Gandalf' },
      },
    ]);
    expect(JSON.stringify(result)).not.toContain(gandalfId);
    expect(JSON.stringify(result)).not.toContain(frodoId);
  });

  it('ignore une invitation destinée à un autre utilisateur', async () => {
    await storeOpenInvitation();

    expect(await list.execute({ userId: anActor(randomUUID()) })).toHaveLength(0);
  });

  it('masque une invitation dont l invitant a disparu', async () => {
    directory = new InMemoryCampaignDirectory();
    list = new ListCampaignInvitationsUseCase(campaigns, invitations, directory);
    await storeOpenInvitation();

    expect(await list.execute({ userId: anActor(frodoId) })).toHaveLength(0);
  });

  it('compte les invitations ouvertes', async () => {
    await storeOpenInvitation();

    expect(await count.execute({ userId: anActor(frodoId) })).toEqual({ count: 1 });
  });

  it('exclut des lectures un cycle terminal conservé', async () => {
    const { invitation } = await storeOpenInvitation();
    invitation.refuse(invitation.targetUserId, TEST_INSTANT);
    await invitations.refuse({
      invitation,
      principalId: invitation.targetUserId,
      idempotencyKey: randomUUID(),
      intentHash: randomUUID(),
      occurredAt: TEST_INSTANT,
      effectiveRole: null,
    });

    expect(await list.execute({ userId: anActor(frodoId) })).toHaveLength(0);
    expect(await count.execute({ userId: anActor(frodoId) })).toEqual({ count: 0 });
    expect(invitations.snapshots()).toHaveLength(1);
  });
});
