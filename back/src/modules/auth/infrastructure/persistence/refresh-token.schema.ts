import { Schema } from 'mongoose';

import type { RefreshTokenDocument } from './refresh-token.mapper';

export const REFRESH_TOKEN_MODEL = 'RefreshToken';

export const RefreshTokenSchema = new Schema<RefreshTokenDocument>(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    familyId: { type: String, required: true, index: true },
    revokedAt: { type: String },
    createdAt: { type: String, required: true },

    // `expires: 0` purge le document à l'instant porté par le champ. Requiert un
    // type Date — voir refresh-token.mapper.ts.
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { versionKey: false },
);
