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

// Requête de vérification d'email : le front POST le token brut reçu par lien.
export const VerifyEmailSchema = z.object({
  token: z.string(),
});

// Les formes persistées des refresh tokens et des tokens de vérification ne
// vivent plus ici : elles ne traversent jamais le réseau, donc elles n'ont rien
// à faire dans le contrat front↔back. Ce sont désormais les snapshots de leurs
// agrégats respectifs, dans back/src/modules/auth/domain/.

export type TokenTier = z.infer<typeof TokenTierEnum>;
export type TokenPayload = z.infer<typeof TokenPayloadSchema>;
export type AuthTokens = z.infer<typeof AuthTokensSchema>;
export type RefreshDto = z.infer<typeof RefreshSchema>;
export type VerifyEmailDto = z.infer<typeof VerifyEmailSchema>;
