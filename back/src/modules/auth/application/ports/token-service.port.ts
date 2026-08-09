import type { TokenPayload } from '@donjon-dragon/shared/auth-schema';

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

// Émission seule : la vérification de l'access token appartient à la couche
// présentation (JwtStrategy + JwtAuthGuard). Le refresh token, lui, est un
// secret opaque porté par l'agrégat RefreshToken, pas par ce service.
export interface TokenServicePort {
  signAccessToken(payload: TokenPayload): string;
}
