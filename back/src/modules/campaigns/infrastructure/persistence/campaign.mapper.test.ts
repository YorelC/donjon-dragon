import { randomUUID } from 'crypto';
import { describe, expect, it } from 'vitest';
import { UserId } from '@kernel/domain/user-id';
import { TEST_INSTANT } from '@kernel/testing/fixed-clock';

import { Campaign } from '../../domain/campaign';
import { CampaignName } from '../../domain/campaign-name';
import { toDomain, toPersistence } from './campaign.mapper';

const OWNER_ID = UserId.create(randomUUID());
const CAMPAIGN_NAME = CampaignName.create('La Communauté de l Anneau');

describe('campaign persistence mapper', () => {
  it('sépare la racine de ses adhésions', () => {
    const persisted = toPersistence(aCampaign());

    expect(persisted.root).not.toHaveProperty('members');
    expect(persisted.memberships).toHaveLength(1);
    expect(persisted.memberships[0]?.campaignId).toBe(persisted.root._id);
  });

  it('écrit des dates BSON et la révision', () => {
    const persisted = toPersistence(aCampaign());

    expect(persisted.root.createdAt).toBeInstanceOf(Date);
    expect(persisted.root.updatedAt).toBeInstanceOf(Date);
    expect(persisted.root.revision).toBe(0);
  });

  it('réhydrate la racine et ses adhésions sans perte', () => {
    const campaign = aCampaign();
    const persisted = toPersistence(campaign);

    expect(toDomain(persisted.root, persisted.memberships).snapshot()).toEqual(
      campaign.snapshot(),
    );
  });
});

function aCampaign(): Campaign {
  return Campaign.create(CAMPAIGN_NAME, OWNER_ID, TEST_INSTANT);
}
