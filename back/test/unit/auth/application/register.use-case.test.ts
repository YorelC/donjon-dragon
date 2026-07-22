// ============================================================
// back/test/unit/auth/application/register.use-case.test.ts
// Tests — RegisterUseCase (register + auto-login)
// ============================================================
// RED: ces tests échouent car register.use-case.ts n'existe pas
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';

import { RegisterUseCase } from '../../../../src/auth/application/register.use-case.js';
import { EmailAlreadyInUseError } from '../../../../src/auth/domain/auth.errors.js';
import { hashRefreshToken } from '../../../../src/auth/domain/refresh-token.entity.js';
import { InMemoryUserRepository } from '../../../../src/user/infrastructure/in-memory-user.repository.js';
import { InMemoryRefreshTokenRepository } from '../../../../src/auth/infrastructure/in-memory-refresh-token.repository.js';
import { FakePasswordHasher } from '../_fakes/fake-password-hasher.js';
import { FakeTokenService } from '../_fakes/fake-token-service.js';
import type { RegisterDto } from '@donjon-dragon/shared/user-schema.js';
import type { TokenPayload } from '@donjon-dragon/shared/auth-schema.js';

const dto: RegisterDto = {
  email: 'aragorn@gondor.me',
  displayName: 'Aragorn',
  password: 'secret123',
};

describe('RegisterUseCase', () => {
  let userRepo: InMemoryUserRepository;
  let refreshRepo: InMemoryRefreshTokenRepository;
  let useCase: RegisterUseCase;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    refreshRepo = new InMemoryRefreshTokenRepository();
    useCase = new RegisterUseCase(
      userRepo,
      refreshRepo,
      new FakePasswordHasher(),
      new FakeTokenService(),
    );
  });

  it('crée un user et retourne des tokens + le user public', async () => {
    const tokens = await useCase.execute(dto);
    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();
    expect(tokens.user.email).toBe(dto.email);
  });

  it('hash le mot de passe (jamais en clair)', async () => {
    await useCase.execute(dto);
    const saved = await userRepo.findByEmail(dto.email);
    expect(saved?.passwordHash).toBe('hashed:secret123');
    expect(saved?.passwordHash).not.toBe(dto.password);
  });

  it('émet un access token tier full', async () => {
    const tokens = await useCase.execute(dto);
    const payload = JSON.parse(tokens.accessToken) as TokenPayload;
    expect(payload.tier).toBe('full');
    expect(payload.userId).toBe(tokens.user.id);
  });

  it('persiste le refresh token (hashé)', async () => {
    const tokens = await useCase.execute(dto);
    const record = await refreshRepo.findByTokenHash(
      hashRefreshToken(tokens.refreshToken),
    );
    expect(record).not.toBeNull();
    expect(record?.userId).toBe(tokens.user.id);
  });

  it('ne renvoie jamais le passwordHash au client', async () => {
    const tokens = await useCase.execute(dto);
    expect(tokens.user).not.toHaveProperty('passwordHash');
  });

  it('rejette un email déjà utilisé', async () => {
    await useCase.execute(dto);
    await expect(useCase.execute(dto)).rejects.toThrow(EmailAlreadyInUseError);
  });
});
