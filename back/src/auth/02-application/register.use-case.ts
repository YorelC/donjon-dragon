import type { RegisterDto, PublicUser } from '@donjon-dragon/shared/user-schema';
import type { UserRepositoryPort } from '../../user/03-domain/user.repository.port';
import type { EmailVerificationTokenRepositoryPort } from '../03-domain/email/email-verification-token.repository.port';
import type { PasswordHasherPort } from '../03-domain/password-hasher.port';
import type { EmailSenderPort } from '../03-domain/email/email-sender.port';
import { EmailAlreadyInUseError } from '../03-domain/auth.errors';
import { DisplayNameAlreadyTakenError } from '../../user/03-domain/user.errors';
import {
  createEmailVerificationToken,
  hashVerificationToken,
} from '../03-domain/email/email-verification-token.entity.js';
import { createUser, toPublicUser } from '../../user/03-domain/user.entity';

export class RegisterUseCase {
  constructor(
    private readonly userRepo: UserRepositoryPort,
    private readonly verificationRepo: EmailVerificationTokenRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly emailSender: EmailSenderPort,
  ) {}

  async execute(dto: RegisterDto): Promise<PublicUser> {
    const existingEmail = await this.userRepo.findByEmail(dto.email);
    if (existingEmail) throw new EmailAlreadyInUseError();

    const existingDisplayName = await this.userRepo.findByDisplayName(dto.displayName);
    if (existingDisplayName) throw new DisplayNameAlreadyTakenError();

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
