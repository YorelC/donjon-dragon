import { describe, it, expect, beforeEach } from 'vitest';
import { UserId } from '@kernel/domain/user-id';
import { FixedClock } from '@kernel/testing/fixed-clock';

import { GetUserProfileUseCase } from '@modules/user/application/use-cases/get-user-profile.use-case';
import { InMemoryUserRepository } from '@modules/user/testing/in-memory-user.repository';
import { aUser } from '@modules/user/testing/user.fixture';
import {
  InvalidRefreshTokenError,
  RefreshRaceError,
  RefreshTokenExpiredError,
  TokenReuseDetectedError,
} from '../../domain/auth.errors';
import {
  REFRESH_GRACE_MS,
  REFRESH_TTL_MS,
  RefreshToken,
} from '../../domain/token/refresh-token';
import { InMemoryRefreshTokenRepository } from '../../testing/in-memory-refresh-token.repository';
import { StubTokenService } from '../../testing/stub-token.service';
import { RefreshTokensUseCase } from './refresh-tokens.use-case';

/**
 * La rotation et la detection de reutilisation : le mecanisme le plus delicat de
 * l'authentification.
 *
 * Avant l'injection d'horloge, deux de ces tests devaient rehydrater un token avec
 * une date reculee a la main pour franchir une limite temporelle. Ils avancent
 * maintenant l'horloge, ce qui est ce que fait le temps.
 */
describe('RefreshTokensUseCase', () => {
  let useCase: RefreshTokensUseCase;
  let refreshRepo: InMemoryRefreshTokenRepository;
  let clock: FixedClock;
  let alice: ReturnType<typeof aUser>;

  beforeEach(async () => {
    const userRepo = new InMemoryUserRepository();
    alice = aUser({ email: 'alice@example.com', displayName: 'alice' });
    await userRepo.save(alice);

    clock = new FixedClock();
    refreshRepo = new InMemoryRefreshTokenRepository();
    useCase = new RefreshTokensUseCase(
      new GetUserProfileUseCase(userRepo),
      refreshRepo,
      new StubTokenService(),
      clock,
    );
  });

  async function issueTokenForAlice(): Promise<string> {
    const { token, plainToken } = RefreshToken.issue(
      UserId.create(alice.id.value),
      clock.now(),
    );
    await refreshRepo.save(token);
    return plainToken;
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

  it('tolère un rejeu jusqu au dernier instant de la fenêtre', async () => {
    const plainToken = await issueTokenForAlice();
    await useCase.execute(plainToken);

    clock.advanceBy(REFRESH_GRACE_MS);

    // La limite elle-meme est INCLUSE. Un test qui ne peut pas choisir l'instant ne
    // peut pas verifier ce bord.
    await expect(useCase.execute(plainToken)).rejects.toThrow(RefreshRaceError);
  });

  it('détecte la réutilisation et fait tomber TOUTE la lignée', async () => {
    const plainToken = await issueTokenForAlice();
    const rotated = await useCase.execute(plainToken);

    // Un cran au-dela de la fenetre : ce n'est plus une concurrence plausible, c'est
    // un secret qui a fuite.
    clock.advanceBy(REFRESH_GRACE_MS + 1);

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
    const plainToken = await issueTokenForAlice();

    // Plus besoin de rehydrater un token avec une expiration passee pour connaitre
    // son secret en clair : on avance simplement d'une semaine et une milliseconde.
    clock.advanceBy(REFRESH_TTL_MS + 1);

    await expect(useCase.execute(plainToken)).rejects.toThrow(
      RefreshTokenExpiredError,
    );
  });

  it('accepte encore un token à l instant exact de son expiration', async () => {
    const plainToken = await issueTokenForAlice();

    clock.advanceBy(REFRESH_TTL_MS);

    await expect(useCase.execute(plainToken)).resolves.toBeTruthy();
  });
});
