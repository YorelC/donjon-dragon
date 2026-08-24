import { Schema } from 'mongoose';

export const COMMAND_RECEIPT_MODEL = 'CommandReceipt';
export const COMMAND_RECEIPT_COLLECTION = 'command_receipts';

export interface CommandReceiptDocument {
  _id: string;
  schemaVersion: number;
  principalKey: string;
  idempotencyKey: string;
  ownerModule: string;
  intentionType: string;
  intentHash: string;
  status: string;
  result: unknown;
  campaignId: string;
  aggregateIds: string[];
  randomResults: unknown[];
  createdAt: Date;
  updatedAt: Date;
}

export const CommandReceiptSchema = new Schema<CommandReceiptDocument>(
  {
    _id: { type: String, required: true },
    schemaVersion: { type: Number, required: true, min: 1 },
    principalKey: { type: String, required: true },
    idempotencyKey: { type: String, required: true },
    ownerModule: { type: String, required: true },
    intentionType: { type: String, required: true },
    intentHash: { type: String, required: true },
    status: { type: String, required: true },
    result: { type: Schema.Types.Mixed, required: true },
    campaignId: { type: String, required: true },
    aggregateIds: { type: [String], required: true },
    randomResults: { type: [Schema.Types.Mixed], required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: COMMAND_RECEIPT_COLLECTION, id: false, versionKey: false },
);

CommandReceiptSchema.index(
  { principalKey: 1, idempotencyKey: 1 },
  { unique: true },
);
CommandReceiptSchema.index({ campaignId: 1, createdAt: 1 });
