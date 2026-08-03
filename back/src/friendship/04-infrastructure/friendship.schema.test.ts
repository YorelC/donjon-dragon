import { describe, it, expect } from 'vitest';
import { FriendshipSchema } from './friendship.schema';

describe('FriendshipSchema — indexes', () => {
  it('définit l\'index { recipientId: 1, status: 1 }', () => {
    const indexes = FriendshipSchema.indexes();
    const hasIndex = indexes.some(([fields]) => {
      const keys = Object.keys(fields);
      return (
        keys.length === 2 &&
        fields.recipientId === 1 &&
        fields.status === 1
      );
    });
    expect(hasIndex).toBe(true);
  });

  it('définit l\'index { requesterId: 1, recipientId: 1 }', () => {
    const indexes = FriendshipSchema.indexes();
    const hasIndex = indexes.some(([fields]) => {
      const keys = Object.keys(fields);
      return (
        keys.length === 2 &&
        fields.requesterId === 1 &&
        fields.recipientId === 1
      );
    });
    expect(hasIndex).toBe(true);
  });

  it('définit l\'index { status: 1 }', () => {
    const indexes = FriendshipSchema.indexes();
    const hasIndex = indexes.some(([fields]) => {
      const keys = Object.keys(fields);
      return keys.length === 1 && fields.status === 1;
    });
    expect(hasIndex).toBe(true);
  });

  it('la requête countPendingReceived utilise recipientId+status — l\'index le couvre', () => {
    // countPendingReceived fait un countDocuments({ recipientId, status: 'pending' })
    // L'index { recipientId: 1, status: 1 } couvre exactement cette requête.
    const indexes = FriendshipSchema.indexes();
    const recipientStatusIndex = indexes.filter(([fields]) => {
      const keys = Object.keys(fields);
      return keys.length === 2 && fields.recipientId === 1 && fields.status === 1;
    });
    expect(recipientStatusIndex.length).toBeGreaterThanOrEqual(1);
  });
});