import { randomUUID } from 'crypto';
import { describe, expect, it } from 'vitest';
import { UserId } from '@kernel/domain/user-id';
import { TEST_INSTANT } from '@kernel/testing/fixed-clock';

import { CampaignId } from '../domain/campaign-id';
import { CampaignInvitation } from '../domain/campaign-invitation';
import {
  AlreadyOpenCampaignInvitationError,
  CampaignInvitationRevisionConflictError,
} from '../domain/campaign.errors';
import { InMemoryCampaignInvitationRepository } from './in-memory-campaign-invitation.repository';

describe('InMemoryCampaignInvitationRepository', () => {
  it('arbitre la concurrence sur l unicité du cycle ouvert', async () => {
    const repository = new InMemoryCampaignInvitationRepository();
    const first = anInvitation();
    const second = CampaignInvitation.create({
      campaignId: first.campaignId,
      targetUserId: first.targetUserId,
      invitedByUserId: UserId.create(randomUUID()),
      now: TEST_INSTANT,
    });
    await repository.create(command(first));

    await expect(repository.create(command(second))).rejects.toThrow(
      AlreadyOpenCampaignInvitationError,
    );
  });

  it('refuse une transition fondée sur une révision périmée', async () => {
    const repository = new InMemoryCampaignInvitationRepository();
    const invitation = anInvitation();
    await repository.create(command(invitation));
    const firstReader = await repository.findOpen(
      invitation.campaignId,
      invitation.targetUserId,
    );
    const staleReader = await repository.findOpen(
      invitation.campaignId,
      invitation.targetUserId,
    );
    firstReader?.cancel(TEST_INSTANT);
    await repository.cancel(command(firstReader!));
    staleReader?.cancel(TEST_INSTANT);

    await expect(repository.cancel(command(staleReader!))).rejects.toThrow(
      CampaignInvitationRevisionConflictError,
    );
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

function command(invitation: CampaignInvitation) {
  return {
    invitation,
    principalId: invitation.invitedByUserId,
    idempotencyKey: randomUUID(),
    intentHash: randomUUID(),
    occurredAt: TEST_INSTANT,
    effectiveRole: 'gameMaster',
  };
}
