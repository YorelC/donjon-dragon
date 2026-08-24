import {
  CampaignInvitation,
  type CampaignInvitationSnapshot,
} from '../../domain/campaign-invitation';
import type { CampaignInvitationDocument } from './campaign-invitation.schema';

const SCHEMA_VERSION = 1;

export function invitationToDomain(
  document: CampaignInvitationDocument,
): CampaignInvitation {
  return CampaignInvitation.restore(toSnapshot(document));
}

export function invitationToPersistence(
  invitation: CampaignInvitation,
): CampaignInvitationDocument {
  const snapshot = invitation.snapshot();
  return {
    _id: snapshot.id,
    schemaVersion: SCHEMA_VERSION,
    campaignId: snapshot.campaignId,
    targetUserId: snapshot.targetUserId,
    invitedByUserId: snapshot.invitedByUserId,
    status: snapshot.status,
    revision: snapshot.revision,
    createdAt: new Date(snapshot.createdAt),
    updatedAt: new Date(snapshot.updatedAt),
    closedAt: snapshot.closedAt ? new Date(snapshot.closedAt) : null,
  };
}

function toSnapshot(
  document: CampaignInvitationDocument,
): CampaignInvitationSnapshot {
  return {
    id: document._id,
    campaignId: document.campaignId,
    targetUserId: document.targetUserId,
    invitedByUserId: document.invitedByUserId,
    status: document.status,
    revision: document.revision,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
    closedAt: document.closedAt?.toISOString() ?? null,
  };
}
