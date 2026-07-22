// ============================================================
// back/test/unit/auth/application/login.use-case.test.ts
// Tests — LoginUseCase
// ============================================================
// RED: ces tests échouent car login.use-case.ts n'existe pas
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';

import { LoginUseCase } from '../../../../src/auth/application/login.use-case.js';
import { InvalidCredentialsError } from '../../../../src/auth/domain/auth.errors.js';
import { hashRefreshToken } from '../../../../src/auth/domain/refresh-token.entity.js';
import { createUser } from '../../../../src/user/domain/user.entity.js';
import { InMemoryUserRepository } from '../../../../src/user/infrastructure/in-memory-user.repository.js';
import { InMemoryRefreshTokenRepository } from '../../../../src/auth/infrastructure/in-memory-refresh-token.repository.js';
import { FakePasswordHasher } from '../_fakes/fake-password-hasher.js';
import { FakeTokenService } from '../_fakes/fake-token-service.js';
import type { LoginDto } from '@donjon-dragon/shared/user-schema.js';
import type { TokenPayload } from '@donjon-dragon/shared/auth-schema.js';

const credentials: LoginDto = { email: 'aragorn@gondor.me', password: 'secret123' };

describe('LoginUseCase', () => {
  let userRepo: InMemoryUserRepository;
  let refreshRepo: InMemoryRefreshTokenRepository;
  let useCase: LoginUseCase;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    refreshRepo = new InMemoryRefreshTokenRepository();
    // seed : passwordHash cohérent avec FakePasswordHasher
    await userRepo.save(
      createUser({
        email: credentials.email,
        displayName: 'Aragorn',
        passwordHash: 'hashed:secret123',
      }),
    );
    useCase = new LoginUseCase(
      userRepo,
      refreshRepo,
      new FakePasswordHasher(),
      new FakeTokenService(),
    );
  });

  it('connexion valide → tokens tier full', async () => {
    const tokens = await useCase.execute(credentials);
    const payload = JSON.parse(tokens.accessToken) as TokenPayload;
    expect(payload.tier).toBe('full');
    expect(tokens.user.email).toBe(credentials.email);
  });

  it('persiste un refresh token', async () => {
    const tokens = await useCase.execute(credentials);
    const record = await refreshRepo.findByTokenHash(
      hashRefreshToken(tokens.refreshToken),
    );
    expect(record).not.toBeNull();
  });

  it('mauvais mot de passe → InvalidCredentialsError', async () => {
    await expect(
      useCase.execute({ ...credentials, password: 'wrong-pass' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('email inconnu → InvalidCredentialsError', async () => {
    await expect(
      useCase.execute({ email: 'sauron@mordor.me', password: 'secret123' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });
});
