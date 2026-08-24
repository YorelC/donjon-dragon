import { describe, expect, it } from 'vitest';

import {
  CAMPAIGN_MEMBERSHIP_COLLECTION,
  CampaignMembershipSchema,
} from './campaign-membership.schema';
import { CAMPAIGN_COLLECTION, CampaignSchema } from './campaign.schema';

describe('Campaign persistence schemas', () => {
  it('nomme explicitement les deux collections', () => {
    expect(CampaignSchema.get('collection')).toBe(CAMPAIGN_COLLECTION);
    expect(CampaignMembershipSchema.get('collection')).toBe(
      CAMPAIGN_MEMBERSHIP_COLLECTION,
    );
  });

  it('ne persiste plus les membres dans la racine campagne', () => {
    expect(CampaignSchema.path('members')).toBeUndefined();
    expect(CampaignSchema.path('revision')).toBeDefined();
    expect(CampaignSchema.path('schemaVersion')).toBeDefined();
  });

  it('garantit une adhésion unique par campagne et utilisateur', () => {
    expect(hasUniqueMembershipIndex()).toBe(true);
  });

  it('indexe les lectures par utilisateur, statut, campagne et rôle', () => {
    expect(hasIndex({ userId: 1, status: 1 })).toBe(true);
    expect(hasIndex({ campaignId: 1, role: 1, status: 1 })).toBe(true);
  });
});

function hasUniqueMembershipIndex(): boolean {
  return CampaignMembershipSchema.indexes().some(
    ([fields, options]) =>
      fields.campaignId === 1 && fields.userId === 1 && options.unique === true,
  );
}

function hasIndex(expected: Record<string, number>): boolean {
  return CampaignMembershipSchema.indexes().some(([fields]) =>
    Object.entries(expected).every(([key, value]) => fields[key] === value),
  );
}
