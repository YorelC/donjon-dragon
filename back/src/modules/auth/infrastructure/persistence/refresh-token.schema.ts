import { Schema } from 'mongoose';

import type { RefreshTokenDocument } from './refresh-token.mapper';

export const REFRESH_TOKEN_MODEL = 'RefreshToken';

export const RefreshTokenSchema = new Schema<RefreshTokenDocument>(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    familyId: { type: String, required: true, index: true },
    expiresAt: { type: String, required: true },
    revokedAt: { type: String },
    createdAt: { type: String, required: true },

    // Purge automatique — voir refresh-token.mapper.ts pour la raison du champ.
    expiresOn: { type: Date, required: true, expires: 0 },
  },
  { versionKey: false },
);
