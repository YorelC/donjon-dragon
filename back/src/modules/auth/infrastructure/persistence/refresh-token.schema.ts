import { Schema } from 'mongoose';
import type { RefreshTokenRecord } from '@donjon-dragon/shared/auth-schema';

export const REFRESH_TOKEN_MODEL = 'RefreshToken';

export const RefreshTokenSchema = new Schema<RefreshTokenRecord>(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    familyId: { type: String, required: true, index: true },
    expiresAt: { type: String, required: true },
    revokedAt: { type: String },
    createdAt: { type: String, required: true },
  },
  { versionKey: false },
);
