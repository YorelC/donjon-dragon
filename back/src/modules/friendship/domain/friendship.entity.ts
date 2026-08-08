import { randomUUID } from 'crypto';
import type { Friendship } from '@donjon-dragon/shared/friendship-schema';

import {
  CannotFriendSelfError,
  FriendRequestNotPendingError,
  NotRequestRecipientError,
} from './friendship.errors';

export function createFriendRequest(requesterId: string, recipientId: string): Friendship {
  if (requesterId === recipientId) throw new CannotFriendSelfError();
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    requesterId,
    recipientId,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
}

export function acceptFriendRequest(friendship: Friendship, actingUserId: string): Friendship {
  assertPendingRecipientAction(friendship, actingUserId);
  return { ...friendship, status: 'accepted', updatedAt: new Date().toISOString() };
}

export function refuseFriendRequest(friendship: Friendship, actingUserId: string): Friendship {
  assertPendingRecipientAction(friendship, actingUserId);
  return { ...friendship, status: 'refused', updatedAt: new Date().toISOString() };
}

export function involvesUser(friendship: Friendship, userId: string): boolean {
  return friendship.requesterId === userId || friendship.recipientId === userId;
}

export function friendIdFor(friendship: Friendship, userId: string): string {
  return friendship.requesterId === userId ? friendship.recipientId : friendship.requesterId;
}

// Seul le destinataire d'une demande encore 'pending' peut l'accepter/refuser.
function assertPendingRecipientAction(friendship: Friendship, actingUserId: string): void {
  if (friendship.status !== 'pending') throw new FriendRequestNotPendingError();
  if (friendship.recipientId !== actingUserId) throw new NotRequestRecipientError();
}
