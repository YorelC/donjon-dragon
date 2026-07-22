import { z } from 'zod';

import { PublicUserSchema } from './user-schema.js';

export const TokenTierEnum = z.enum(['full', 'readonly']);

// Contenu métier de l'access token (exp/iat ajoutés par la lib JWT).
// Aligné sur ARCHITECTURE-SPINE.md AD-2 : { userId, role, roomId?, tier }.
export const TokenPayloadSchema = z.object({
  userId: z.string().uuid(),
  role: z.string(),
  tier: TokenTierEnum,
  roomId: z.string().uuid().optional(),
});

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: PublicUserSchema,
});

export const RefreshSchema = z.object({
  refreshToken: z.string(),
});

// Refresh token persisté (stateful) pour révocation/rotation.
// On stocke le hash SHA-256 du token, jamais le token brut.
export const RefreshTokenRecordSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  tokenHash: z.string(),
  familyId: z.string().uuid(),
  expiresAt: z.string().datetime(),
  revokedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});

export type TokenTier = z.infer<typeof TokenTierEnum>;
export type TokenPayload = z.infer<typeof TokenPayloadSchema>;
export type AuthTokens = z.infer<typeof AuthTokensSchema>;
export type RefreshDto = z.infer<typeof RefreshSchema>;
export type RefreshTokenRecord = z.infer<typeof RefreshTokenRecordSchema>;
