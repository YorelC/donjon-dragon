import { randomUUID } from 'crypto';
import { describe, expect, it } from 'vitest';
import { UserId } from '@kernel/domain/user-id';
import { TEST_INSTANT } from '@kernel/testing/fixed-clock';

import { CampaignId } from '../../domain/campaign-id';
import { CampaignInvitation } from '../../domain/campaign-invitation';
import {
  invitationToDomain,
  invitationToPersistence,
} from './campaign-invitation.mapper';

describe('campaign invitation persistence mapper', () => {
  it('écrit l identité, la version de schéma et des dates BSON', () => {
    const invitation = anInvitation();
    const document = invitationToPersistence(invitation);

    expect(document._id).toBe(invitation.id.value);
    expect(document.schemaVersion).toBe(1);
    expect(document.createdAt).toBeInstanceOf(Date);
    expect(document.updatedAt).toBeInstanceOf(Date);
    expect(document.closedAt).toBeNull();
  });

  it('réhydrate un cycle terminal sans perte', () => {
    const invitation = anInvitation();
    invitation.accept(invitation.targetUserId, TEST_INSTANT);
    const document = invitationToPersistence(invitation);

    expect(invitationToDomain(document).snapshot()).toEqual(invitation.snapshot());
  });
});

function anInvitation(): CampaignInvitation {
  return CampaignInvitation.create({
    campaignId: CampaignId.create(randomUUID()),
    targetUserId: UserId.create(randomUUID()),
    invitedByUserId: UserId.create(randomUUID()),
    now: TEST_INSTANT,
  });
}
