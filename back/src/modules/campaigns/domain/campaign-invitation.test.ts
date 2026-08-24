import { randomUUID } from 'crypto';
import { describe, expect, it } from 'vitest';
import { UserId } from '@kernel/domain/user-id';
import { TEST_INSTANT } from '@kernel/testing/fixed-clock';

import { CampaignId } from './campaign-id';
import { CampaignInvitation } from './campaign-invitation';
import { NoPendingCampaignInvitationError } from './campaign.errors';

const LATER = new Date(TEST_INSTANT.getTime() + 60_000);

function anInvitation(): CampaignInvitation {
  return CampaignInvitation.create({
    campaignId: CampaignId.create(randomUUID()),
    targetUserId: UserId.create(randomUUID()),
    invitedByUserId: UserId.create(randomUUID()),
    now: TEST_INSTANT,
  });
}

describe('CampaignInvitation', () => {
  it('crée un cycle ouvert à identité stable et le restaure', () => {
    const invitation = anInvitation();
    const snapshot = invitation.snapshot();

    expect(snapshot).toMatchObject({
      status: 'pending',
      revision: 0,
      createdAt: TEST_INSTANT.toISOString(),
      closedAt: null,
    });
    expect(CampaignInvitation.restore(snapshot).snapshot()).toEqual(snapshot);
  });

  it.each([
    ['accepted', (item: CampaignInvitation) => item.accept(item.targetUserId, LATER)],
    ['refused', (item: CampaignInvitation) => item.refuse(item.targetUserId, LATER)],
    ['cancelled', (item: CampaignInvitation) => item.cancel(LATER)],
  ] as const)('passe à l état terminal %s', (status, transition) => {
    const invitation = anInvitation();

    transition(invitation);

    expect(invitation.snapshot()).toMatchObject({
      status,
      revision: 1,
      updatedAt: LATER.toISOString(),
      closedAt: LATER.toISOString(),
    });
  });

  it('interdit à une autre cible de répondre', () => {
    const invitation = anInvitation();

    expect(() => invitation.accept(UserId.create(randomUUID()), LATER)).toThrow(
      NoPendingCampaignInvitationError,
    );
    expect(invitation.status).toBe('pending');
  });

  it('interdit toute réponse à un cycle terminal', () => {
    const invitation = anInvitation();
    invitation.refuse(invitation.targetUserId, LATER);

    expect(() => invitation.accept(invitation.targetUserId, LATER)).toThrow(
      NoPendingCampaignInvitationError,
    );
  });
});
