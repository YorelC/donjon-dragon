// ============================================================
// back/test/unit/auth/application/issue-readonly-token.use-case.test.ts
// Tests — IssueReadonlyTokenUseCase (token spectateur, self-service)
// ============================================================
// RED: ces tests échouent car issue-readonly-token.use-case.ts n'existe pas
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';

import { IssueReadonlyTokenUseCase } from '../../../../src/auth/application/issue-readonly-token.use-case.js';
import { UserNotFoundError } from '../../../../src/auth/domain/auth.errors.js';
import { createUser } from '../../../../src/user/domain/user.entity.js';
import { InMemoryUserRepository } from '../../../../src/user/infrastructure/in-memory-user.repository.js';
import { FakeTokenService } from '../_fakes/fake-token-service.js';
import type { User } from '@donjon-dragon/shared/user-schema.js';
import type { TokenPayload } from '@donjon-dragon/shared/auth-schema.js';

describe('IssueReadonlyTokenUseCase', () => {
  let userRepo: InMemoryUserRepository;
  let useCase: IssueReadonlyTokenUseCase;
  let user: User;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    user = createUser({
      email: 'spectateur@gondor.me',
      displayName: 'Spectateur',
      passwordHash: 'hashed:secret123',
    });
    await userRepo.save(user);
    useCase = new IssueReadonlyTokenUseCase(userRepo, new FakeTokenService());
  });

  it('émet un access token tier readonly pour le user', async () => {
    const { accessToken } = await useCase.execute(user.id);
    const payload = JSON.parse(accessToken) as TokenPayload;
    expect(payload.tier).toBe('readonly');
    expect(payload.userId).toBe(user.id);
  });

  it('ne délivre pas de refresh token à un spectateur', async () => {
    const result = await useCase.execute(user.id);
    expect(result).not.toHaveProperty('refreshToken');
  });

  it('user inconnu → UserNotFoundError', async () => {
    await expect(useCase.execute(crypto.randomUUID())).rejects.toThrow(
      UserNotFoundError,
    );
  });
});
