import { Schema } from 'mongoose';

import { CAMPAIGN_ROLES, type CampaignRole } from '../../domain/campaign-role';
import {
  MEMBERSHIP_STATUSES,
  type MembershipStatus,
} from '../../domain/membership-status';

export const CAMPAIGN_MEMBERSHIP_MODEL = 'CampaignMembership';
export const CAMPAIGN_MEMBERSHIP_COLLECTION = 'campaign_memberships';

export interface CampaignMembershipDocument {
  _id: string;
  schemaVersion: number;
  campaignId: string;
  userId: string;
  role: CampaignRole;
  status: MembershipStatus;
  invitedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const CampaignMembershipSchema = new Schema<CampaignMembershipDocument>(
  {
    _id: { type: String, required: true },
    schemaVersion: { type: Number, required: true, min: 1 },
    campaignId: { type: String, required: true },
    userId: { type: String, required: true },
    role: { type: String, enum: [...CAMPAIGN_ROLES], required: true },
    status: { type: String, enum: [...MEMBERSHIP_STATUSES], required: true },
    invitedBy: { type: String, default: null },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: CAMPAIGN_MEMBERSHIP_COLLECTION, id: false, versionKey: false },
);

CampaignMembershipSchema.index({ campaignId: 1, userId: 1 }, { unique: true });
CampaignMembershipSchema.index({ userId: 1, status: 1 });
CampaignMembershipSchema.index({ campaignId: 1, role: 1, status: 1 });
