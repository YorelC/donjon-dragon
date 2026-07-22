// ============================================================
// back/test/unit/auth/application/logout.use-case.test.ts
// Tests — LogoutUseCase (révocation de famille, idempotent)
// ============================================================
// RED: ces tests échouent car logout.use-case.ts n'existe pas
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';

import { LogoutUseCase } from '../../../../src/auth/application/logout.use-case.js';
import { createRefreshTokenRecord } from '../../../../src/auth/domain/refresh-token.entity.js';
import { InMemoryRefreshTokenRepository } from '../../../../src/auth/infrastructure/in-memory-refresh-token.repository.js';

describe('LogoutUseCase', () => {
  let refreshRepo: InMemoryRefreshTokenRepository;
  let useCase: LogoutUseCase;

  beforeEach(() => {
    refreshRepo = new InMemoryRefreshTokenRepository();
    useCase = new LogoutUseCase(refreshRepo);
  });

  it('révoque la famille du refresh token fourni', async () => {
    const familyId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const a = createRefreshTokenRecord(userId, familyId);
    const b = createRefreshTokenRecord(userId, familyId);
    await refreshRepo.save(a.record);
    await refreshRepo.save(b.record);

    await useCase.execute(a.plainToken);

    const aAfter = await refreshRepo.findByTokenHash(a.record.tokenHash);
    const bAfter = await refreshRepo.findByTokenHash(b.record.tokenHash);
    expect(aAfter?.revokedAt).toBeDefined();
    expect(bAfter?.revokedAt).toBeDefined();
  });

  it('est idempotent : un token inconnu ne jette pas', async () => {
    await expect(useCase.execute('inconnu')).resolves.toBeUndefined();
  });
});
