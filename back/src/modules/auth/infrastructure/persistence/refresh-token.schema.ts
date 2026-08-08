import { Schema } from 'mongoose';
import type { RefreshTokenRecord } from '@donjon-dragon/shared/auth-schema';

export const REFRESH_TOKEN_MODEL = 'RefreshToken';

/** Le record métier, plus le champ de purge propre à la persistance. */
export type RefreshTokenDocument = RefreshTokenRecord & { expiresOn: Date };

export const RefreshTokenSchema = new Schema<RefreshTokenDocument>(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    familyId: { type: String, required: true, index: true },
    expiresAt: { type: String, required: true },
    revokedAt: { type: String },
    createdAt: { type: String, required: true },

    // Purge automatique. Un index TTL Mongo n'agit QUE sur un champ Date : posé
    // sur `expiresAt`, qui est une chaine ISO (contrat partagé avec le front),
    // il serait silencieusement ignoré. Ce champ est donc une projection Date
    // du même instant, écrite par l'adapter et jamais relue.
    expiresOn: { type: Date, required: true, expires: 0 },
  },
  { versionKey: false },
);
