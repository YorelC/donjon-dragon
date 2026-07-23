import type { RegisterDto, PublicUser } from '@donjon-dragon/shared/user-schema';
import type { UserRepositoryPort } from '../../user/domain/user.repository.port';
import type { EmailVerificationTokenRepositoryPort } from '../domain/email-verification-token.repository.port';
import type { PasswordHasherPort } from '../domain/password-hasher.port';
import type { EmailSenderPort } from '../domain/email-sender.port';
import { EmailAlreadyInUseError } from '../domain/auth.errors';
import {
  createEmailVerificationToken,
  hashVerificationToken,
} from '../domain/email-verification-token.entity.js';
import { createUser, toPublicUser } from '../../user/domain/user.entity';

export class RegisterUseCase {
  constructor(
    private readonly userRepo: UserRepositoryPort,
    private readonly verificationRepo: EmailVerificationTokenRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly emailSender: EmailSenderPort,
  ) {}

  async execute(dto: RegisterDto): Promise<PublicUser> {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) throw new EmailAlreadyInUseError();

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const user = createUser({
      email: dto.email,
      displayName: dto.displayName,
      passwordHash,
    });
    await this.userRepo.save(user);

    const { record, plainToken } = createEmailVerificationToken(user.id);
    await this.verificationRepo.save(record);

    const verificationUrl = `${dto.appOrigin}/verify-email?token=${plainToken}`;
    await this.emailSender.sendVerificationEmail(user.email, verificationUrl);

    return toPublicUser(user);
  }
}
