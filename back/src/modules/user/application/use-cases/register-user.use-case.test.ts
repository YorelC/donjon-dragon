import { describe, it, expect, beforeEach } from 'vitest';
import { UserId } from '@kernel/domain/user-id';
import { FixedClock } from '@kernel/testing/fixed-clock';

import { InMemoryUserRepository } from '../../testing/in-memory-user.repository';
import { aUser } from '../../testing/user.fixture';
import {
  DisplayNameAlreadyTakenError,
  EmailAlreadyInUseError,
} from '../../domain/user.errors';
import { RegisterUserUseCase } from './register-user.use-case';

// Les invariants d'unicite appartiennent a l'agregat User : ils sont donc
// verifies ici, et non dans le test du use-case d'inscription d'auth.
describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let userRepo: InMemoryUserRepository;

  const command = {
    email: 'alice@example.com',
    displayName: 'alice',
    passwordHash: 'hashed_SecurePassword123!',
  };

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    useCase = new RegisterUserUseCase(userRepo, new FixedClock());
  });

  it('cree un utilisateur et ne renvoie jamais le hash', async () => {
    const result = await useCase.execute(command);

    expect(result.email).toBe('alice@example.com');
    expect(result.displayName).toBe('alice');
    expect(result.emailVerified).toBe(false);
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('persiste l utilisateur avec son hash', async () => {
    const result = await useCase.execute(command);

    const stored = await userRepo.findById(UserId.create(result.id));
    expect(stored?.passwordHash).toBe('hashed_SecurePassword123!');
  });

  it('leve EmailAlreadyInUseError si l email est deja pris', async () => {
    await userRepo.save(aUser({ ...command, displayName: 'quelqu-un-dautre' }));

    await expect(useCase.execute(command)).rejects.toThrow(EmailAlreadyInUseError);
  });

  it('leve DisplayNameAlreadyTakenError si le pseudo est deja pris', async () => {
    await userRepo.save(aUser({ ...command, email: 'autre@example.com' }));

    await expect(useCase.execute(command)).rejects.toThrow(
      DisplayNameAlreadyTakenError,
    );
  });
});
