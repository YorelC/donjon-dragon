// ============================================================
// back/test/unit/auth/application/verify-email.use-case.test.ts
// Tests — VerifyEmailUseCase (consommation du token + auto-login)
// ============================================================
// RED: ces tests échouent car verify-email.use-case.ts n'existe pas
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';

import { VerifyEmailUseCase } from '../../../../src/auth/application/verify-email.use-case.js';
import {
  InvalidVerificationTokenError,
  VerificationTokenExpiredError,
} from '../../../../src/auth/domain/auth.errors.js';
import {
  createEmailVerificationToken,
  hashVerificationToken,
} from '../../../../src/auth/domain/email-verification-token.entity.js';
import { hashRefreshToken } from '../../../../src/auth/domain/refresh-token.entity.js';
import { createUser } from '../../../../src/user/domain/user.entity.js';
import { InMemoryUserRepository } from '../../../../src/user/infrastructure/in-memory-user.repository.js';
import { InMemoryEmailVerificationTokenRepository } from '../../../../src/auth/infrastructure/in-memory-email-verification-token.repository.js';
import { InMemoryRefreshTokenRepository } from '../../../../src/auth/infrastructure/in-memory-refresh-token.repository.js';
import { FakeTokenService } from '../_fakes/fake-token-service.js';
import type { User } from '@donjon-dragon/shared/user-schema.js';
import type { TokenPayload } from '@donjon-dragon/shared/auth-schema.js';

describe('VerifyEmailUseCase', () => {
  let userRepo: InMemoryUserRepository;
  let verificationRepo: InMemoryEmailVerificationTokenRepository;
  let refreshRepo: InMemoryRefreshTokenRepository;
  let useCase: VerifyEmailUseCase;
  let user: User;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    verificationRepo = new InMemoryEmailVerificationTokenRepository();
    refreshRepo = new InMemoryRefreshTokenRepository();
    user = createUser({
      email: 'aragorn@gondor.me',
      displayName: 'Aragorn',
      passwordHash: 'hashed:secret123',
    });
    await userRepo.save(user);
    useCase = new VerifyEmailUseCase(
      userRepo,
      verificationRepo,
      refreshRepo,
      new FakeTokenService(),
    );
  });

  it('token valide → marque le user vérifié et retourne des tokens tier full', async () => {
    const { record, plainToken } = createEmailVerificationToken(user.id);
    await verificationRepo.save(record);

    const tokens = await useCase.execute(plainToken);

    const payload = JSON.parse(tokens.accessToken) as TokenPayload;
    expect(payload.tier).toBe('full');
    expect(payload.userId).toBe(user.id);
    expect(tokens.user.emailVerified).toBe(true);

    const updated = await userRepo.findById(user.id);
    expect(updated?.emailVerified).toBe(true);
  });

  it('persiste un refresh token (auto-login après vérification)', async () => {
    const { record, plainToken } = createEmailVerificationToken(user.id);
    await verificationRepo.save(record);

    const tokens = await useCase.execute(plainToken);

    const saved = await refreshRepo.findByTokenHash(
      hashRefreshToken(tokens.refreshToken),
    );
    expect(saved).not.toBeNull();
    expect(saved?.userId).toBe(user.id);
  });

  it('supprime le token de vérification (usage unique)', async () => {
    const { record, plainToken } = createEmailVerificationToken(user.id);
    await verificationRepo.save(record);

    await useCase.execute(plainToken);

    const consumed = await verificationRepo.findByTokenHash(record.tokenHash);
    expect(consumed).toBeNull();
  });

  it('token inconnu → InvalidVerificationTokenError', async () => {
    await expect(useCase.execute('inconnu')).rejects.toThrow(
      InvalidVerificationTokenError,
    );
  });

  it('token expiré → VerificationTokenExpiredError', async () => {
    const { record } = createEmailVerificationToken(user.id);
    await verificationRepo.save({
      ...record,
      tokenHash: hashVerificationToken('expired-plain'),
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });

    await expect(useCase.execute('expired-plain')).rejects.toThrow(
      VerificationTokenExpiredError,
    );
  });
});
