import { Inject, Injectable } from '@nestjs/common';
import type { RegisterDto, PublicUser } from '@donjon-dragon/shared/user-schema';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '@modules/user/application/ports/user-repository.port';
import {
  EMAIL_VERIFICATION_TOKEN_REPOSITORY,
  type EmailVerificationTokenRepositoryPort,
} from '../ports/email-verification-token.repository.port';
import { PASSWORD_HASHER, type PasswordHasherPort } from '../ports/password-hasher.port';
import { EMAIL_SENDER, type EmailSenderPort } from '../ports/email-sender.port';
import { EmailAlreadyInUseError } from '../../domain/auth.errors';
import { DisplayNameAlreadyTakenError } from '@modules/user/domain/user.errors';
import { createEmailVerificationToken } from '../../domain/email/email-verification-token.entity';
import { createUser, toPublicUser } from '@modules/user/domain/user.entity';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
    @Inject(EMAIL_VERIFICATION_TOKEN_REPOSITORY)
    private readonly verificationRepo: EmailVerificationTokenRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
    @Inject(EMAIL_SENDER) private readonly emailSender: EmailSenderPort,
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
