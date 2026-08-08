import type { TokenPayload } from '@donjon-dragon/shared/auth-schema';

// Contenu métier de l'access token d'un joueur connecté : identique après
// login, vérification d'email et rotation du refresh token.
export function createAccessTokenPayload(userId: string): TokenPayload {
  return {
    userId,
    role: 'player',
    tier: 'full',
  };
}

// Même identité, mais un tier qui interdit les routes mutantes (cf. TierGuard).
export function createReadonlyTokenPayload(userId: string): TokenPayload {
  return {
    ...createAccessTokenPayload(userId),
    tier: 'readonly',
  };
}
