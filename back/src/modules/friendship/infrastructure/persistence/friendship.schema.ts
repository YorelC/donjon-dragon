import { Schema } from 'mongoose';

import { FRIENDSHIP_STATUSES } from '../../domain/friendship-status';
import type { FriendshipDocument } from './friendship.mapper';

export const FRIENDSHIP_MODEL = 'Friendship';

// Typé sur le snapshot du domaine, comme user.schema.ts : la forme stockée est
// celle que le mapper produit, pas le contrat de transport.
export const FriendshipSchema = new Schema<FriendshipDocument>(
  {
    id: { type: String, required: true, unique: true },
    pairKey: { type: String, required: true },
    requesterId: { type: String, required: true },
    recipientId: { type: String, required: true },
    // Liste dérivée du domaine : plus de littéraux dupliqués ici.
    status: { type: String, enum: [...FRIENDSHIP_STATUSES], required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { versionKey: false },
);

// Indexes for performance
FriendshipSchema.index({ recipientId: 1, status: 1 });
FriendshipSchema.index({ status: 1 });
FriendshipSchema.index(
  { pairKey: 1 },
  {
    unique: true,
    partialFilterExpression: { pairKey: { $type: 'string' } },
  },
);
