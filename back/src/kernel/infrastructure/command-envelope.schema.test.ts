import { describe, expect, it } from 'vitest';

import { CommandReceiptSchema } from './command-receipt.schema';
import { FunctionalAuditEntrySchema } from './functional-audit-entry.schema';
import { OutboxMessageSchema } from './outbox-message.schema';

describe('Command envelope schemas', () => {
  it('rend la clé idempotente unique par principal', () => {
    const found = CommandReceiptSchema.indexes().some(
      ([fields, options]) =>
        fields.principalKey === 1 &&
        fields.idempotencyKey === 1 &&
        options.unique === true,
    );

    expect(found).toBe(true);
  });

  it('indexe audit et outbox pour leur consommation', () => {
    expect(hasIndex(FunctionalAuditEntrySchema.indexes(), 'commandReceiptId')).toBe(
      true,
    );
    expect(hasIndex(OutboxMessageSchema.indexes(), 'availableAt')).toBe(true);
  });
});

type SchemaIndexes = ReturnType<typeof CommandReceiptSchema.indexes>;

function hasIndex(indexes: SchemaIndexes, field: string): boolean {
  return indexes.some(([fields]) => fields[field] === 1);
}
