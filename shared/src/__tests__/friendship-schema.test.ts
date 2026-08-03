import { describe, it, expect } from 'vitest';
import { DeleteFriendParamsSchema } from '../friendship-schema';

describe('DeleteFriendParamsSchema (INV-002)', () => {
  it.each([
    { uuid: '550e8400-e29b-41d4-a716-446655440000', label: 'UUID v4 standard' },
    { uuid: '123e4567-e89b-12d3-a456-426614174000', label: 'UUID v1 standard' },
  ])('INV-002: valide un UUID valide — $label', ({ uuid }) => {
    const result = DeleteFriendParamsSchema.safeParse({ friendshipId: uuid });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.friendshipId).toBe(uuid);
    }
  });

  it.each([
    { value: 'pas-un-uuid', label: 'string non-UUID' },
    { value: '', label: 'chaîne vide' },
    { value: '550e8400-e29b-41d4-a716', label: 'UUID tronqué' },
    { value: 123, label: 'nombre' },
    { value: null, label: 'null' },
    { value: undefined, label: 'undefined' },
  ])('INV-002: rejette $label', ({ value }) => {
    const result = DeleteFriendParamsSchema.safeParse({ friendshipId: value });
    expect(result.success).toBe(false);
  });

  it('INV-002: rejette un objet vide', () => {
    const result = DeleteFriendParamsSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('INV-002: ignore les propriétés supplémentaires (Zod strip par défaut)', () => {
    const result = DeleteFriendParamsSchema.safeParse({
      friendshipId: '550e8400-e29b-41d4-a716-446655440000',
      extra: 'should-be-stripped',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.friendshipId).toBe('550e8400-e29b-41d4-a716-446655440000');
      // Zod strip supprime les clés inconnues
      expect((result.data as Record<string, unknown>).extra).toBeUndefined();
    }
  });
});