import type { TokenPayload } from '@donjon-dragon/shared/auth-schema';

// Access token uniquement (stateless, signé JWT). Le refresh token est
// un secret opaque géré par refresh-token.entity, pas par ce service.
export interface TokenServicePort {
  signAccessToken(payload: TokenPayload): string;
  verifyAccessToken(token: string): TokenPayload;
}
