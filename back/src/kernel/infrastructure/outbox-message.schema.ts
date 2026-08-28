import { Schema } from 'mongoose';

import {
  OUTBOX_AUDIENCE_POLICY_VALUES,
  OUTBOX_DELIVERY_CHANNEL_VALUES,
  OUTBOX_STATUS_VALUES,
  type OutboxAudiencePolicy,
  type OutboxDeliveryChannel,
  type OutboxStatus,
} from './outbox-message.contract';

export const OUTBOX_MESSAGE_MODEL = 'OutboxMessage';
export const OUTBOX_MESSAGE_COLLECTION = 'outbox_messages';

export interface OutboxMessageDocument {
  _id: string;
  schemaVersion: number;
  ownerModule: string;
  campaignId?: string;
  causationId: string;
  aggregateId: string;
  aggregateRevision: number;
  factType: string;
  fact: unknown;
  deliveryChannel: OutboxDeliveryChannel;
  audiencePolicy: OutboxAudiencePolicy;
  audienceUserIds: string[];
  status: OutboxStatus;
  availableAt: Date;
  leaseUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const OutboxMessageSchema = new Schema<OutboxMessageDocument>(
  {
    _id: { type: String, required: true },
    schemaVersion: { type: Number, required: true, min: 1 },
    ownerModule: { type: String, required: true },
    campaignId: { type: String, required: false },
    causationId: { type: String, required: true },
    aggregateId: { type: String, required: true },
    aggregateRevision: { type: Number, required: true, min: 0 },
    factType: { type: String, required: true },
    fact: { type: Schema.Types.Mixed, required: true },
    deliveryChannel: {
      type: String,
      required: true,
      enum: OUTBOX_DELIVERY_CHANNEL_VALUES,
    },
    audiencePolicy: {
      type: String,
      required: true,
      enum: OUTBOX_AUDIENCE_POLICY_VALUES,
    },
    audienceUserIds: { type: [String], required: true, default: [] },
    status: { type: String, required: true, enum: OUTBOX_STATUS_VALUES },
    availableAt: { type: Date, required: true },
    leaseUntil: { type: Date, default: null },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: OUTBOX_MESSAGE_COLLECTION, id: false, versionKey: false },
);

OutboxMessageSchema.index({ status: 1, availableAt: 1, leaseUntil: 1 });
OutboxMessageSchema.index({ ownerModule: 1, aggregateId: 1, createdAt: 1 });
