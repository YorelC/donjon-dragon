import { describe, it, expect, beforeEach } from 'vitest';
import type { RegisterDto } from '@donjon-dragon/shared/user-schema';
import { EmailAlreadyInUseError } from '../03-domain/auth.errors';
import { DisplayNameAlreadyTakenError } from '../../user/03-domain/user.errors';
import { RegisterUseCase } from './register.use-case';
import { InMemoryUserRepository } from '../../user/04-infrastructure/in-memory-user.repository';
import { InMemoryEmailVerificationTokenRepository } from '../04-infrastructure/email/in-memory-email-verification-token.repository';
import { InMemoryPasswordHasher } from '../04-infrastructure/in-memory-password-hasher';
import { InMemoryEmailSender } from '../04-infrastructure/email/in-memory-email-sender';
import { createUser } from '../../user/03-domain/user.entity';

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let userRepo: InMemoryUserRepository;
  let verificationRepo: InMemoryEmailVerificationTokenRepository;
  let passwordHasher: InMemoryPasswordHasher;
  let emailSender: InMemoryEmailSender;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    verificationRepo = new InMemoryEmailVerificationTokenRepository();
    passwordHasher = new InMemoryPasswordHasher();
    emailSender = new InMemoryEmailSender();
    useCase = new RegisterUseCase(userRepo, verificationRepo, passwordHasher, emailSender);
  });

  it('crée un nouvel utilisateur avec email et displayName uniques', async () => {
    const dto: RegisterDto = {
      email: 'alice@example.com',
      displayName: 'alice',
      password: 'SecurePassword123!',
      appOrigin: 'http://localhost:5173',
    };

    const result = await useCase.execute(dto);

    expect(result.email).toBe('alice@example.com');
    expect(result.displayName).toBe('alice');
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('lève EmailAlreadyInUseError si email est déjà utilisé', async () => {
    const existing = createUser({
      email: 'alice@example.com',
      displayName: 'alice',
      passwordHash: 'hashedpw',
    });
    await userRepo.save(existing);

    const dto: RegisterDto = {
      email: 'alice@example.com',
      displayName: 'bob',
      password: 'SecurePassword123!',
      appOrigin: 'http://localhost:5173',
    };

    await expect(useCase.execute(dto)).rejects.toThrow(EmailAlreadyInUseError);
  });

  it('lève DisplayNameAlreadyTakenError si displayName est déjà utilisé', async () => {
    const existing = createUser({
      email: 'alice@example.com',
      displayName: 'alice',
      passwordHash: 'hashedpw',
    });
    await userRepo.save(existing);

    const dto: RegisterDto = {
      email: 'bob@example.com',
      displayName: 'alice',
      password: 'SecurePassword123!',
      appOrigin: 'http://localhost:5173',
    };

    await expect(useCase.execute(dto)).rejects.toThrow(DisplayNameAlreadyTakenError);
  });
});
