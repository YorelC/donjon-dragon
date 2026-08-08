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
