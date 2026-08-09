import { Schema } from 'mongoose';

import { REVOCATION_REASON_VALUES } from '../../domain/token/refresh-token';
import type { RefreshTokenDocument } from './refresh-token.mapper';

export const REFRESH_TOKEN_MODEL = 'RefreshToken';

export const RefreshTokenSchema = new Schema<RefreshTokenDocument>(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    familyId: { type: String, required: true, index: true },
    revokedAt: { type: String },
    // Pourquoi : une rotation tolere un rejeu immediat (course entre onglets),
    // une compromission jamais. Voir REFRESH_GRACE_MS.
    revokedReason: { type: String, enum: [...REVOCATION_REASON_VALUES] },
    createdAt: { type: String, required: true },

    // `expires: 0` purge le document à l'instant porté par le champ. Requiert un
    // type Date — voir refresh-token.mapper.ts.
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { versionKey: false },
);
