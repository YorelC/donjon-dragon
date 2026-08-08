import { describe, it, expect, beforeEach } from 'vitest';
import { UserId } from '@kernel/domain/user-id';
import type { RegisterDto } from '@donjon-dragon/shared/user-schema';

import { RegisterUserUseCase } from '@modules/user/application/use-cases/register-user.use-case';
import { InMemoryUserRepository } from '@modules/user/testing/in-memory-user.repository';
import { InMemoryEmailVerificationTokenRepository } from '../../testing/in-memory-email-verification-token.repository';
import { InMemoryPasswordHasher } from '../../testing/in-memory-password-hasher';
import { InMemoryEmailSender } from '../../testing/in-memory-email-sender';
import { hashVerificationToken } from '../../domain/email/email-verification-token.entity';
import { RegisterUseCase } from './register.use-case';

// Ce use-case ORCHESTRE : hash, delegation de la creation a user, envoi du lien.
// Les invariants d'unicite sont testes chez leur proprietaire,
// user/application/use-cases/register-user.use-case.test.ts.
describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let userRepo: InMemoryUserRepository;
  let verificationRepo: InMemoryEmailVerificationTokenRepository;
  let emailSender: InMemoryEmailSender;

  const dto: RegisterDto = {
    email: 'alice@example.com',
    displayName: 'alice',
    password: 'SecurePassword123!',
    appOrigin: 'http://localhost:5173',
  };

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    verificationRepo = new InMemoryEmailVerificationTokenRepository();
    emailSender = new InMemoryEmailSender();
    useCase = new RegisterUseCase(
      new RegisterUserUseCase(userRepo),
      verificationRepo,
      new InMemoryPasswordHasher(),
      emailSender,
    );
  });

  it('renvoie le profil public du compte cree', async () => {
    const result = await useCase.execute(dto);

    expect(result.email).toBe('alice@example.com');
    expect(result.displayName).toBe('alice');
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('hashe le mot de passe avant de deleguer la creation', async () => {
    const result = await useCase.execute(dto);

    const stored = await userRepo.findById(UserId.create(result.id));
    expect(stored?.passwordHash).toBe('hashed_SecurePassword123!');
    expect(stored?.passwordHash).not.toBe(dto.password);
  });

  it('envoie un lien de verification construit sur appOrigin', async () => {
    await useCase.execute(dto);

    expect(emailSender.sent).toHaveLength(1);
    expect(emailSender.sent[0]!.to).toBe('alice@example.com');
    expect(emailSender.sent[0]!.verificationUrl).toMatch(
      /^http:\/\/localhost:5173\/verify-email\?token=.+/,
    );
  });

  it('persiste un token de verification pour le compte cree', async () => {
    const result = await useCase.execute(dto);

    const plainToken = new URL(
      emailSender.sent[0]!.verificationUrl,
    ).searchParams.get('token');
    expect(plainToken).toBeTruthy();

    const record = await verificationRepo.findByTokenHash(
      hashVerificationToken(plainToken as string),
    );
    expect(record?.userId).toBe(result.id);
  });
});
