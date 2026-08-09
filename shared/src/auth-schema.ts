import { z } from 'zod';

import { PublicUserSchema } from './user-schema.js';

/**
 * Contenu métier de l'access token (exp/iat ajoutés par la lib JWT).
 *
 * L'identité, et rien d'autre. `tier`, `roomId` et `role` ont été retirés : ils
 * étaient écrits en dur à l'émission et lus par personne.
 *
 * Une autorisation ne passera pas par ce jeton. Être maître du jeu est une
 * propriété d'une CAMPAGNE, pas d'un compte : le même joueur est MJ d'une table
 * et joueur d'une autre, et une adhésion retirée doit prendre effet
 * immédiatement — pas à l'expiration d'un token vieux de quinze minutes. Ce
 * contrôle vivra donc sur l'agrégat d'adhésion, comme
 * `friendship.assertInvolves` le fait déjà.
 */
export const TokenPayloadSchema = z.object({
  userId: z.string().uuid(),
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

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;
export type AuthTokens = z.infer<typeof AuthTokensSchema>;
export type RefreshDto = z.infer<typeof RefreshSchema>;
export type VerifyEmailDto = z.infer<typeof VerifyEmailSchema>;
