import { Schema } from 'mongoose';

export const CAMPAIGN_MODEL = 'Campaign';
export const CAMPAIGN_COLLECTION = 'campaigns';

export interface CampaignDocument {
  _id: string;
  schemaVersion: number;
  name: string;
  ownerUserId: string;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export const CampaignSchema = new Schema<CampaignDocument>(
  {
    _id: { type: String, required: true },
    schemaVersion: { type: Number, required: true, min: 1 },
    name: { type: String, required: true },
    ownerUserId: { type: String, required: true },
    revision: { type: Number, required: true, min: 0 },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    deletedAt: { type: Date, default: null },
  },
  { collection: CAMPAIGN_COLLECTION, id: false, versionKey: false },
);

CampaignSchema.index({ ownerUserId: 1 });
CampaignSchema.index({ deletedAt: 1 });
