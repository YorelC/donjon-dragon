import { describe, it, expect, beforeEach } from 'vitest';
import { UserId } from '@kernel/domain/user-id';
import { FixedClock } from '@kernel/testing/fixed-clock';

import { MarkEmailVerifiedUseCase } from '@modules/user/application/use-cases/mark-email-verified.use-case';
import { InMemoryUserRepository } from '@modules/user/testing/in-memory-user.repository';
import { aUser } from '@modules/user/testing/user.fixture';
import {
  InvalidVerificationTokenError,
  VerificationTokenExpiredError,
} from '../../domain/auth.errors';
import {
  EMAIL_VERIFICATION_TTL_MS,
  EmailVerificationToken,
} from '../../domain/email/email-verification-token';
import { InMemoryEmailVerificationTokenRepository } from '../../testing/in-memory-email-verification-token.repository';
import { InMemoryRefreshTokenRepository } from '../../testing/in-memory-refresh-token.repository';
import { StubTokenService } from '../../testing/stub-token.service';
import { VerifyEmailUseCase } from './verify-email.use-case';

/**
 * Le lien de vérification ouvre une session : il consomme le token ET émet une
 * paire. Les deux se datent du même instant, sinon un lien accepté à la limite
 * de sa fenêtre produirait un refresh token daté d'après.
 */
describe('VerifyEmailUseCase', () => {
  let useCase: VerifyEmailUseCase;
  let userRepo: InMemoryUserRepository;
  let verificationRepo: InMemoryEmailVerificationTokenRepository;
  let refreshRepo: InMemoryRefreshTokenRepository;
  let clock: FixedClock;
  let alice: ReturnType<typeof aUser>;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    alice = aUser({ email: 'alice@example.com', displayName: 'alice' });
    await userRepo.save(alice);

    clock = new FixedClock();
    verificationRepo = new InMemoryEmailVerificationTokenRepository();
    refreshRepo = new InMemoryRefreshTokenRepository();
    useCase = new VerifyEmailUseCase(
      new MarkEmailVerifiedUseCase(userRepo),
      verificationRepo,
      refreshRepo,
      new StubTokenService(),
      clock,
    );
  });

  async function issueLinkForAlice(): Promise<string> {
    const { token, plainToken } = EmailVerificationToken.issue(
      UserId.create(alice.id.value),
      clock.now(),
    );
    await verificationRepo.save(token);
    return plainToken;
  }

  it('vérifie le compte et ouvre une session', async () => {
    const plainToken = await issueLinkForAlice();

    const result = await useCase.execute(plainToken);

    expect(result.user.id).toBe(alice.id.value);
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('marque l email du compte comme vérifié', async () => {
    const plainToken = await issueLinkForAlice();

    await useCase.execute(plainToken);

    const stored = await userRepo.findById(UserId.create(alice.id.value));
    expect(stored?.snapshot().emailVerified).toBe(true);
  });

  // Usage unique : le lien est supprimé, pas marqué. Le second clic ne trouve rien.
  it('consomme le lien : un second usage échoue', async () => {
    const plainToken = await issueLinkForAlice();
    await useCase.execute(plainToken);

    await expect(useCase.execute(plainToken)).rejects.toThrow(
      InvalidVerificationTokenError,
    );
  });

  // Le lien lu deux fois avant d'etre supprime : c'est la course que la lecture
  // puis suppression laissait passer. Seule la requete qui supprime poursuit.
  it('ne laisse qu une seule requête concurrente consommer le lien', async () => {
    const plainToken = await issueLinkForAlice();

    const outcomes = await Promise.allSettled([
      useCase.execute(plainToken),
      useCase.execute(plainToken),
    ]);

    expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.status === 'rejected')).toHaveLength(1);
  });

  it('refuse un lien inconnu', async () => {
    await expect(useCase.execute('jamais-emis')).rejects.toThrow(
      InvalidVerificationTokenError,
    );
  });

  it('refuse un lien expiré', async () => {
    const plainToken = await issueLinkForAlice();

    clock.advanceBy(EMAIL_VERIFICATION_TTL_MS + 1);

    await expect(useCase.execute(plainToken)).rejects.toThrow(
      VerificationTokenExpiredError,
    );
  });

  // La limite elle-même est INCLUSE : c'est le bord que seule une horloge
  // contrôlée permet de viser.
  it('accepte encore un lien à l instant exact de son expiration', async () => {
    const plainToken = await issueLinkForAlice();

    clock.advanceBy(EMAIL_VERIFICATION_TTL_MS);

    await expect(useCase.execute(plainToken)).resolves.toBeTruthy();
  });

  // La preuve du seul `clock.now()` : le refresh token émis est daté de l'instant
  // où le lien a été jugé valide, pas d'un second appel à l'horloge.
  it('date le refresh token du même instant que la vérification', async () => {
    const plainToken = await issueLinkForAlice();
    clock.advanceBy(EMAIL_VERIFICATION_TTL_MS);

    await useCase.execute(plainToken);

    const issued = refreshRepo.all()[0]!.snapshot();
    expect(issued.createdAt).toBe(clock.now().toISOString());
  });
});
