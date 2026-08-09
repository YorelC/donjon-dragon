import type { TokenPayload } from '@donjon-dragon/shared/auth-schema';

import type { TokenServicePort } from '../application/ports/token-service.port';

/** Signature factice : les tests d'application n'ont pas à vérifier du JWT. */
export class StubTokenService implements TokenServicePort {
  signAccessToken(payload: TokenPayload): string {
    return `signed:${payload.userId}:${payload.role}`;
  }
}
