import { Schema } from 'mongoose';

export const OUTBOX_MESSAGE_MODEL = 'OutboxMessage';
export const OUTBOX_MESSAGE_COLLECTION = 'outbox_messages';

export interface OutboxMessageDocument {
  _id: string;
  schemaVersion: number;
  ownerModule: string;
  campaignId: string;
  causationId: string;
  aggregateId: string;
  aggregateRevision: number;
  factType: string;
  fact: unknown;
  audiencePolicy: string;
  status: string;
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
    campaignId: { type: String, required: true },
    causationId: { type: String, required: true },
    aggregateId: { type: String, required: true },
    aggregateRevision: { type: Number, required: true, min: 0 },
    factType: { type: String, required: true },
    fact: { type: Schema.Types.Mixed, required: true },
    audiencePolicy: { type: String, required: true },
    status: { type: String, required: true },
    availableAt: { type: Date, required: true },
    leaseUntil: { type: Date, default: null },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: OUTBOX_MESSAGE_COLLECTION, id: false, versionKey: false },
);

OutboxMessageSchema.index({ status: 1, availableAt: 1, leaseUntil: 1 });
OutboxMessageSchema.index({ ownerModule: 1, aggregateId: 1, createdAt: 1 });
