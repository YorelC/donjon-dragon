import type { JwtService } from '@nestjs/jwt';
import { describe, expect, it, vi } from 'vitest';
import { JwtAccessTokenVerifier } from './jwt-access-token-verifier';

const USER_ID = '11111111-1111-4111-8111-111111111111';

describe('JwtAccessTokenVerifier', () => {
  it('retourne une session datée après vérification de signature', async () => {
    const jwt = jwtService({ userId: USER_ID, exp: 2 });
    const verifier = new JwtAccessTokenVerifier(jwt);

    await expect(verifier.verify('signed-token')).resolves.toEqual({
      userId: USER_ID,
      expiresAtMs: 2_000,
    });
  });

  it('ferme la connexion sur un token invalide', async () => {
    const jwt = jwtService({ userId: 'invalid', exp: 2 });
    const verifier = new JwtAccessTokenVerifier(jwt);

    await expect(verifier.verify('signed-token')).resolves.toBeNull();
  });
});

function jwtService(payload: object): JwtService {
  return {
    verifyAsync: vi.fn().mockResolvedValue(payload),
  } as unknown as JwtService;
}
