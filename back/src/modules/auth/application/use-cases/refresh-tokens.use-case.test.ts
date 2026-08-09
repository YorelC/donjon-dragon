import { describe, it, expect, beforeEach } from 'vitest';
import { UserId } from '@kernel/domain/user-id';

import { GetUserProfileUseCase } from '@modules/user/application/use-cases/get-user-profile.use-case';
import { InMemoryUserRepository } from '@modules/user/testing/in-memory-user.repository';
import { aUser } from '@modules/user/testing/user.fixture';
import {
  InvalidRefreshTokenError,
  RefreshRaceError,
  RefreshTokenExpiredError,
  TokenReuseDetectedError,
} from '../../domain/auth.errors';
import { REFRESH_GRACE_MS, RefreshToken } from '../../domain/token/refresh-token';
import { TokenSecret } from '../../domain/token-secret';
import { InMemoryRefreshTokenRepository } from '../../testing/in-memory-refresh-token.repository';
import { StubTokenService } from '../../testing/stub-token.service';
import { RefreshTokensUseCase } from './refresh-tokens.use-case';

// La rotation et la detection de reutilisation n'etaient couvertes par aucun
// test : c'est le mecanisme le plus delicat de l'authentification.
describe('RefreshTokensUseCase', () => {
  let useCase: RefreshTokensUseCase;
  let refreshRepo: InMemoryRefreshTokenRepository;
  let alice: ReturnType<typeof aUser>;

  beforeEach(async () => {
    const userRepo = new InMemoryUserRepository();
    alice = aUser({ email: 'alice@example.com', displayName: 'alice' });
    await userRepo.save(alice);

    refreshRepo = new InMemoryRefreshTokenRepository();
    useCase = new RefreshTokensUseCase(
      new GetUserProfileUseCase(userRepo),
      refreshRepo,
      new StubTokenService(),
    );
  });

  async function issueTokenForAlice(): Promise<string> {
    const { token, plainToken } = RefreshToken.issue(
      UserId.create(alice.id.value),
    );
    await refreshRepo.save(token);
    return plainToken;
  }

  /** Recule la date de révocation, pour sortir de la fenêtre de grâce. */
  async function ageRotation(plainToken: string, byMs: number): Promise<void> {
    const secret = TokenSecret.fromPlain(plainToken);
    const token = await refreshRepo.findBySecret(secret);
    const snapshot = token?.snapshot();
    if (!snapshot?.revokedAt) throw new Error('token non revoque, rien a vieillir');

    await refreshRepo.save(
      RefreshToken.restore({
        ...snapshot,
        revokedAt: new Date(new Date(snapshot.revokedAt).getTime() - byMs).toISOString(),
      }),
    );
  }

  it('échange un token valide contre une paire neuve', async () => {
    const plainToken = await issueTokenForAlice();

    const result = await useCase.execute(plainToken);

    expect(result.refreshToken).not.toBe(plainToken);
    expect(result.accessToken).toBeTruthy();
    expect(result.user.id).toBe(alice.id.value);
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('révoque le token présenté : il est à usage unique', async () => {
    const plainToken = await issueTokenForAlice();

    await useCase.execute(plainToken);

    expect(refreshRepo.all().filter((t) => t.isRevoked)).toHaveLength(1);
  });

  it('garde la même lignée après rotation', async () => {
    const plainToken = await issueTokenForAlice();
    const familyBefore = refreshRepo.all()[0]!.familyId;

    await useCase.execute(plainToken);

    const active = refreshRepo.all().filter((t) => !t.isRevoked);
    expect(active).toHaveLength(1);
    expect(active[0]!.familyId.equals(familyBefore)).toBe(true);
  });

  // Deux onglets presentent le meme token : le second arrive juste apres la
  // rotation. Sans fenetre de grace, la detection de fuite deconnectait les deux.
  it('traite un rejeu immédiat comme une course, sans toucher à la lignée', async () => {
    const plainToken = await issueTokenForAlice();
    const rotated = await useCase.execute(plainToken);

    await expect(useCase.execute(plainToken)).rejects.toThrow(RefreshRaceError);

    // Le token issu de la rotation reste utilisable : l'appelant réessaie et passe.
    const retried = await useCase.execute(rotated.refreshToken);
    expect(retried.refreshToken).toBeTruthy();
    expect(refreshRepo.all().some((t) => !t.isRevoked)).toBe(true);
  });

  it('détecte la réutilisation et fait tomber TOUTE la lignée', async () => {
    const plainToken = await issueTokenForAlice();
    const rotated = await useCase.execute(plainToken);

    // On vieillit la rotation au-dela de la fenetre de grace : ce n'est plus une
    // concurrence plausible, c'est un secret qui a fuite.
    await ageRotation(plainToken, REFRESH_GRACE_MS + 1_000);

    await expect(useCase.execute(plainToken)).rejects.toThrow(TokenReuseDetectedError);

    // Le token legitime issu de la rotation doit tomber aussi — l'attaquant ET
    // la victime sont deconnectes.
    await expect(useCase.execute(rotated.refreshToken)).rejects.toThrow(
      TokenReuseDetectedError,
    );
    expect(refreshRepo.all().every((t) => t.isRevoked)).toBe(true);
  });

  it('refuse un token inconnu', async () => {
    await expect(useCase.execute('jamais-emis')).rejects.toThrow(
      InvalidRefreshTokenError,
    );
  });

  it('refuse un token expiré', async () => {
    // On emet un token, puis on le rehydrate avec une date d'expiration passee :
    // c'est la seule facon de connaitre le secret en clair d'un token perime.
    const { token, plainToken } = RefreshToken.issue(UserId.create(alice.id.value));
    await refreshRepo.save(
      RefreshToken.restore({
        ...token.snapshot(),
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      }),
    );

    await expect(useCase.execute(plainToken)).rejects.toThrow(
      RefreshTokenExpiredError,
    );
  });
});
