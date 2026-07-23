// ============================================================
// back/test/unit/auth/application/register.use-case.test.ts
// Tests — RegisterUseCase (inscription + envoi email de vérification)
// ============================================================
// RED: nouveau contrat — l'inscription NE renvoie PLUS de tokens.
// Elle crée un user non-vérifié et envoie un email de vérification.
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';

import { RegisterUseCase } from '../../../../src/auth/application/register.use-case.js';
import { EmailAlreadyInUseError } from '../../../../src/auth/domain/auth.errors.js';
import { hashVerificationToken } from '../../../../src/auth/domain/email-verification-token.entity.js';
import { InMemoryUserRepository } from '../../../../src/user/infrastructure/in-memory-user.repository.js';
import { InMemoryEmailVerificationTokenRepository } from '../../../../src/auth/infrastructure/in-memory-email-verification-token.repository.js';
import { FakePasswordHasher } from '../_fakes/fake-password-hasher.js';
import { FakeEmailSender } from '../_fakes/fake-email-sender.js';
import type { RegisterDto } from '@donjon-dragon/shared/user-schema.js';

const dto: RegisterDto = {
  email: 'aragorn@gondor.me',
  displayName: 'Aragorn',
  password: 'secret123',
  appOrigin: 'https://gondor.trycloudflare.com',
};

describe('RegisterUseCase', () => {
  let userRepo: InMemoryUserRepository;
  let verificationRepo: InMemoryEmailVerificationTokenRepository;
  let emailSender: FakeEmailSender;
  let useCase: RegisterUseCase;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    verificationRepo = new InMemoryEmailVerificationTokenRepository();
    emailSender = new FakeEmailSender();
    useCase = new RegisterUseCase(
      userRepo,
      verificationRepo,
      new FakePasswordHasher(),
      emailSender,
    );
  });

  it('crée un user non-vérifié et retourne le user public (pas de tokens)', async () => {
    const result = await useCase.execute(dto);
    expect(result.email).toBe(dto.email);
    expect(result.emailVerified).toBe(false);
    expect(result).not.toHaveProperty('accessToken');
    expect(result).not.toHaveProperty('refreshToken');
  });

  it('hash le mot de passe (jamais en clair)', async () => {
    await useCase.execute(dto);
    const saved = await userRepo.findByEmail(dto.email);
    expect(saved?.passwordHash).toBe('hashed:secret123');
    expect(saved?.passwordHash).not.toBe(dto.password);
  });

  it('ne renvoie jamais le passwordHash au client', async () => {
    const result = await useCase.execute(dto);
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('persiste un token de vérification (hashé) pour le user', async () => {
    const result = await useCase.execute(dto);
    const sent = emailSender.sent[0];
    const url = new URL(sent.verificationUrl);
    const plainToken = url.searchParams.get('token') ?? '';
    const record = await verificationRepo.findByTokenHash(
      hashVerificationToken(plainToken),
    );
    expect(record).not.toBeNull();
    expect(record?.userId).toBe(result.id);
  });

  it('envoie un email de vérification vers l\'adresse du user', async () => {
    await useCase.execute(dto);
    expect(emailSender.sent).toHaveLength(1);
    expect(emailSender.sent[0].to).toBe(dto.email);
  });

  it('construit l\'URL de vérification à partir de appOrigin', async () => {
    await useCase.execute(dto);
    const { verificationUrl } = emailSender.sent[0];
    expect(verificationUrl).toContain(`${dto.appOrigin}/verify-email?token=`);
  });

  it('rejette un email déjà utilisé', async () => {
    await useCase.execute(dto);
    await expect(useCase.execute(dto)).rejects.toThrow(EmailAlreadyInUseError);
  });
});
