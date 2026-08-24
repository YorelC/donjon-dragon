import { Campaign, type CampaignSnapshot } from '../../domain/campaign';
import type { CampaignMemberSnapshot } from '../../domain/campaign-member';
import type { CampaignMembershipDocument } from './campaign-membership.schema';
import type { CampaignDocument } from './campaign.schema';

const SCHEMA_VERSION = 1;
const MEMBERSHIP_ID_SEPARATOR = ':';

export interface PersistedCampaign {
  root: CampaignDocument;
  memberships: CampaignMembershipDocument[];
}

interface PersistenceDates {
  createdAt: Date;
  updatedAt: Date;
}

export function toDomain(
  root: CampaignDocument,
  memberships: CampaignMembershipDocument[],
): Campaign {
  return Campaign.restore({
    id: root._id,
    name: root.name,
    ownerId: root.ownerUserId,
    members: memberships.map(toMemberSnapshot),
    revision: root.revision,
    createdAt: root.createdAt.toISOString(),
    updatedAt: root.updatedAt.toISOString(),
  });
}

export function toPersistence(campaign: Campaign): PersistedCampaign {
  const snapshot = campaign.snapshot();
  const dates = {
    createdAt: new Date(snapshot.createdAt),
    updatedAt: new Date(snapshot.updatedAt),
  };
  return {
    root: toRoot(snapshot, dates),
    memberships: snapshot.members.map((member) =>
      toMembership(snapshot.id, member, dates),
    ),
  };
}

function toRoot(snapshot: CampaignSnapshot, dates: PersistenceDates): CampaignDocument {
  return {
    _id: snapshot.id,
    schemaVersion: SCHEMA_VERSION,
    name: snapshot.name,
    ownerUserId: snapshot.ownerId,
    revision: snapshot.revision,
    createdAt: dates.createdAt,
    updatedAt: dates.updatedAt,
    deletedAt: null,
  };
}

function toMembership(
  campaignId: string,
  member: CampaignMemberSnapshot,
  dates: PersistenceDates,
): CampaignMembershipDocument {
  return {
    _id: [campaignId, member.userId].join(MEMBERSHIP_ID_SEPARATOR),
    schemaVersion: SCHEMA_VERSION,
    campaignId,
    userId: member.userId,
    role: member.role,
    status: member.status,
    invitedBy: member.invitedBy,
    createdAt: dates.createdAt,
    updatedAt: dates.updatedAt,
  };
}

function toMemberSnapshot(document: CampaignMembershipDocument): CampaignMemberSnapshot {
  return {
    userId: document.userId,
    role: document.role,
    status: document.status,
    invitedBy: document.invitedBy,
  };
}
