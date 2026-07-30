import { Schema } from 'mongoose';
import type { Friendship } from '@donjon-dragon/shared/friendship-schema';

export const FriendshipSchema = new Schema<Friendship>(
  {
    id: { type: String, required: true, unique: true },
    requesterId: { type: String, required: true },
    recipientId: { type: String, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'refused'], required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { versionKey: false },
);

// Indexes for performance
FriendshipSchema.index({ requesterId: 1, recipientId: 1 });
FriendshipSchema.index({ status: 1 });
