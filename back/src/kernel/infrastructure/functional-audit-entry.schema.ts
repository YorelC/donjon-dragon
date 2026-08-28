import { Schema } from 'mongoose';

export const FUNCTIONAL_AUDIT_ENTRY_MODEL = 'FunctionalAuditEntry';
export const FUNCTIONAL_AUDIT_ENTRY_COLLECTION = 'functional_audit_entries';

export interface FunctionalAuditEntryDocument {
  _id: string;
  schemaVersion: number;
  ownerModule: string;
  campaignId?: string;
  commandReceiptId: string;
  actorKey: string;
  effectiveRole: string | null;
  action: string;
  aggregateId: string;
  revisionBefore: number | null;
  revisionAfter: number;
  reasons: string[];
  sources: string[];
  audiences: string[];
  occurredAt: Date;
}

export const FunctionalAuditEntrySchema = new Schema<FunctionalAuditEntryDocument>(
  {
    _id: { type: String, required: true },
    schemaVersion: { type: Number, required: true, min: 1 },
    ownerModule: { type: String, required: true },
    campaignId: { type: String, required: false },
    commandReceiptId: { type: String, required: true },
    actorKey: { type: String, required: true },
    effectiveRole: { type: String, default: null },
    action: { type: String, required: true },
    aggregateId: { type: String, required: true },
    revisionBefore: { type: Number, default: null },
    revisionAfter: { type: Number, required: true, min: 0 },
    reasons: { type: [String], required: true },
    sources: { type: [String], required: true },
    audiences: { type: [String], required: true },
    occurredAt: { type: Date, required: true },
  },
  { collection: FUNCTIONAL_AUDIT_ENTRY_COLLECTION, id: false, versionKey: false },
);

FunctionalAuditEntrySchema.index({ campaignId: 1, occurredAt: 1, _id: 1 });
FunctionalAuditEntrySchema.index({ ownerModule: 1, occurredAt: 1, _id: 1 });
FunctionalAuditEntrySchema.index({ aggregateId: 1 });
FunctionalAuditEntrySchema.index({ commandReceiptId: 1 });
