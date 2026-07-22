// ============================================================
// back/test/unit/auth/application/refresh-tokens.use-case.test.ts
// Tests — RefreshTokensUseCase (rotation + détection de réutilisation)
// ============================================================
// RED: ces tests échouent car refresh-tokens.use-case.ts n'existe pas
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';

import { RefreshTokensUseCase } from '../../../../src/auth/application/refresh-tokens.use-case.js';
import {
  InvalidRefreshTokenError,
  TokenReuseDetectedError,
  RefreshTokenExpiredError,
} from '../../../../src/auth/domain/auth.errors.js';
import {
  createRefreshTokenRecord,
  hashRefreshToken,
} from '../../../../src/auth/domain/refresh-token.entity.js';
import { createUser } from '../../../../src/user/domain/user.entity.js';
import { InMemoryUserRepository } from '../../../../src/user/infrastructure/in-memory-user.repository.js';
import { InMemoryRefreshTokenRepository } from '../../../../src/auth/infrastructure/in-memory-refresh-token.repository.js';
import { FakeTokenService } from '../_fakes/fake-token-service.js';
import type { User } from '@donjon-dragon/shared/user-schema.js';
import type { TokenPayload } from '@donjon-dragon/shared/auth-schema.js';

describe('RefreshTokensUseCase', () => {
  let userRepo: InMemoryUserRepository;
  let refreshRepo: InMemoryRefreshTokenRepository;
  let useCase: RefreshTokensUseCase;
  let user: User;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    refreshRepo = new InMemoryRefreshTokenRepository();
    user = createUser({
      email: 'aragorn@gondor.me',
      displayName: 'Aragorn',
      passwordHash: 'hashed:secret123',
    });
    await userRepo.save(user);
    useCase = new RefreshTokensUseCase(userRepo, refreshRepo, new FakeTokenService());
  });

  it('effectue la rotation : nouvelle paire, ancien révoqué, même famille', async () => {
    const { record, plainToken } = createRefreshTokenRecord(user.id);
    await refreshRepo.save(record);

    const tokens = await useCase.execute(plainToken);

    expect(tokens.refreshToken).not.toBe(plainToken);
    const payload = JSON.parse(tokens.accessToken) as TokenPayload;
    expect(payload.tier).toBe('full');

    const old = await refreshRepo.findByTokenHash(record.tokenHash);
    expect(old?.revokedAt).toBeDefined();

    const fresh = await refreshRepo.findByTokenHash(
      hashRefreshToken(tokens.refreshToken),
    );
    expect(fresh).not.toBeNull();
    expect(fresh?.familyId).toBe(record.familyId);
  });

  it('token inconnu → InvalidRefreshTokenError', async () => {
    await expect(useCase.execute('inconnu')).rejects.toThrow(
      InvalidRefreshTokenError,
    );
  });

  it('réutilisation d\'un token révoqué → reuse détecté + famille tuée', async () => {
    const familyId = crypto.randomUUID();
    const a = createRefreshTokenRecord(user.id, familyId);
    const b = createRefreshTokenRecord(user.id, familyId);
    await refreshRepo.save(a.record);
    await refreshRepo.save(b.record);
    // a a déjà tourné → révoqué. Un attaquant rejoue a.
    await refreshRepo.revokeById(a.record.id);

    await expect(useCase.execute(a.plainToken)).rejects.toThrow(
      TokenReuseDetectedError,
    );

    // toute la famille doit être révoquée, y compris b encore actif
    const bAfter = await refreshRepo.findByTokenHash(b.record.tokenHash);
    expect(bAfter?.revokedAt).toBeDefined();
  });

  it('token expiré → RefreshTokenExpiredError', async () => {
    const expired = {
      ...createRefreshTokenRecord(user.id).record,
      tokenHash: hashRefreshToken('expired-plain'),
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    };
    await refreshRepo.save(expired);

    await expect(useCase.execute('expired-plain')).rejects.toThrow(
      RefreshTokenExpiredError,
    );
  });
});
