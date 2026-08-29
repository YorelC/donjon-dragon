import type { Connection, Model } from 'mongoose';
import { describe, expect, it, vi, type Mock } from 'vitest';
import { UserId } from '@kernel/domain/user-id';

import { MEMBERSHIP_STATUS } from '../../domain/membership-status';
import type { CampaignMembershipDocument } from './campaign-membership.schema';
import type { CampaignDocument } from './campaign.schema';
import { MongoCampaignPersistenceRepository } from './mongo-campaign-persistence.repository';

const OWNER_ID = '11111111-1111-4111-8111-111111111111';
const CAMPAIGN_IDS = [
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
] as const;
const NOW = new Date('2026-08-28T10:00:00.000Z');

/** Le `find` de Mongoose, dont seul le NOMBRE d'appels intéresse ces tests. */
type FindMock = Mock;

/**
 * PERF-01 : hydrater racine par racine coûtait une lecture d'adhésions par
 * campagne. Le compte d'appels est la seule chose qui empêche la boucle de
 * revenir sans que rien ne casse.
 */
describe('MongoCampaignPersistenceRepository', () => {
  it('lit les adhésions de toutes les campagnes en une seule requête', async () => {
    const membershipFind: FindMock = vi.fn(() => leanTo(membershipsFor(...CAMPAIGN_IDS)));
    const repository = repositoryWith(
      rootsFinding([...CAMPAIGN_IDS]),
      membershipsFinding(membershipFind),
    );

    const campaigns = await repository.listForUser(
      UserId.create(OWNER_ID),
      MEMBERSHIP_STATUS.active,
    );

    expect(campaigns).toHaveLength(3);
    // Une lecture pour la liste d'adhesions du joueur, une pour celles des trois
    // campagnes. Pas quatre.
    expect(membershipFind).toHaveBeenCalledTimes(2);
    expect(membershipFind.mock.calls[1]?.[0]).toEqual({
      campaignId: { $in: [...CAMPAIGN_IDS] },
    });
  });

  it('rattache chaque adhésion à sa propre campagne', async () => {
    const [first, second] = CAMPAIGN_IDS;
    const repository = repositoryWith(
      rootsFinding([first, second]),
      membershipsFinding(vi.fn(() => leanTo(membershipsFor(first, second)))),
    );

    const campaigns = await repository.listForUser(
      UserId.create(OWNER_ID),
      MEMBERSHIP_STATUS.active,
    );

    expect(campaigns.map((campaign) => campaign.id.value)).toEqual([first, second]);
    campaigns.forEach((campaign) => expect(campaign.members).toHaveLength(1));
  });
});

function repositoryWith(
  roots: Model<CampaignDocument>,
  memberships: Model<CampaignMembershipDocument>,
): MongoCampaignPersistenceRepository {
  return new MongoCampaignPersistenceRepository(
    roots,
    memberships,
    {} as unknown as Connection,
  );
}

function rootsFinding(ids: string[]): Model<CampaignDocument> {
  return {
    find: vi.fn(() => leanTo(ids.map(rootDocument))),
  } as unknown as Model<CampaignDocument>;
}

function membershipsFinding(find: FindMock): Model<CampaignMembershipDocument> {
  return { find } as unknown as Model<CampaignMembershipDocument>;
}

function leanTo<T>(value: T) {
  return { lean: () => Promise.resolve(value) };
}

function membershipsFor(...campaignIds: string[]): CampaignMembershipDocument[] {
  return campaignIds.map((campaignId) => ({
    _id: `${campaignId}:${OWNER_ID}`,
    schemaVersion: 1,
    campaignId,
    userId: OWNER_ID,
    role: 'gameMaster',
    status: MEMBERSHIP_STATUS.active,
    invitedBy: null,
    createdAt: NOW,
    updatedAt: NOW,
  })) as CampaignMembershipDocument[];
}

function rootDocument(id: string): CampaignDocument {
  return {
    _id: id,
    schemaVersion: 1,
    name: 'La Malédiction de Strahd',
    ownerUserId: OWNER_ID,
    revision: 0,
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
  };
}
