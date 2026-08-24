import { Schema } from 'mongoose';

import {
  CAMPAIGN_INVITATION_STATUSES,
  type CampaignInvitationStatus,
} from '../../domain/campaign-invitation-status';

export const CAMPAIGN_INVITATION_MODEL = 'CampaignInvitation';
export const CAMPAIGN_INVITATION_COLLECTION = 'campaign_invitations';

export interface CampaignInvitationDocument {
  _id: string;
  schemaVersion: number;
  campaignId: string;
  targetUserId: string;
  invitedByUserId: string;
  status: CampaignInvitationStatus;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
}

export const CampaignInvitationSchema = new Schema<CampaignInvitationDocument>(
  {
    _id: { type: String, required: true },
    schemaVersion: { type: Number, required: true, min: 1 },
    campaignId: { type: String, required: true },
    targetUserId: { type: String, required: true },
    invitedByUserId: { type: String, required: true },
    status: { type: String, enum: [...CAMPAIGN_INVITATION_STATUSES], required: true },
    revision: { type: Number, required: true, min: 0 },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    closedAt: { type: Date, default: null },
  },
  { collection: CAMPAIGN_INVITATION_COLLECTION, id: false, versionKey: false },
);

CampaignInvitationSchema.index(
  { campaignId: 1, targetUserId: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } },
);
CampaignInvitationSchema.index({ targetUserId: 1, status: 1 });
CampaignInvitationSchema.index({ campaignId: 1, status: 1 });
