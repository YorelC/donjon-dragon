import { randomUUID } from 'crypto';
import { describe, expect, it } from 'vitest';
import { UserId } from '@kernel/domain/user-id';
import { TEST_INSTANT } from '@kernel/testing/fixed-clock';

import { aCampaign, withPlayer } from '../testing/campaign.fixture';
import { toCampaignCommandResult } from './campaign-command.mapper';

describe('toCampaignCommandResult', () => {
  it('projette les états autoritaires de l acteur et de la cible', () => {
    const ownerId = randomUUID();
    const playerId = randomUUID();
    const campaign = withPlayer(aCampaign(ownerId), ownerId, playerId);
    campaign.promote(UserId.create(ownerId), UserId.create(playerId), TEST_INSTANT);

    const result = toCampaignCommandResult(campaign, UserId.create(ownerId), {
      displayName: 'Frodon',
      userId: UserId.create(playerId),
    });

    expect(result.actor).toEqual({
      membership: 'active',
      role: 'gameMaster',
      isOwner: true,
    });
    expect(result.target).toEqual({
      displayName: 'Frodon',
      membership: 'active',
      role: 'gameMaster',
      isOwner: false,
    });
  });

  it('ne conserve aucun droit pour un acteur parti', () => {
    const ownerId = randomUUID();
    const memberId = randomUUID();
    const campaign = withPlayer(aCampaign(ownerId), ownerId, memberId);
    campaign.leave(UserId.create(memberId), null, TEST_INSTANT);

    const result = toCampaignCommandResult(
      campaign,
      UserId.create(memberId),
      null,
    );

    expect(result.actor).toEqual({
      membership: 'left',
      role: null,
      isOwner: false,
    });
  });
});
