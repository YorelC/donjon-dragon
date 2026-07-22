import type { TokenPayload } from '@donjon-dragon/shared/auth-schema.js';

import type { TokenServicePort } from '../../../../src/auth/domain/token-service.port.js';

// Double de test : encode le payload en JSON pour que les tests puissent
// inspecter le tier/userId sans lib JWT.
export class FakeTokenService implements TokenServicePort {
  signAccessToken(payload: TokenPayload): string {
    return JSON.stringify(payload);
  }

  verifyAccessToken(token: string): TokenPayload {
    return JSON.parse(token) as TokenPayload;
  }
}
