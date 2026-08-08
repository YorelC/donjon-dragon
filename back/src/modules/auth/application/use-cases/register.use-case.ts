import { Inject, Injectable } from '@nestjs/common';
import type { RegisterDto, PublicUser } from '@donjon-dragon/shared/user-schema';
import { UserId } from '@kernel/domain/user-id';

import { RegisterUserUseCase } from '@modules/user/application/use-cases/register-user.use-case';
import {
  EMAIL_VERIFICATION_TOKEN_REPOSITORY,
  type EmailVerificationTokenRepositoryPort,
} from '../ports/email-verification-token.repository.port';
import { PASSWORD_HASHER, type PasswordHasherPort } from '../ports/password-hasher.port';
import { EMAIL_SENDER, type EmailSenderPort } from '../ports/email-sender.port';
import { EmailVerificationToken } from '../../domain/email/email-verification-token';

/**
 * Orchestre l'inscription : hash du mot de passe (préoccupation d'auth), puis
 * création du compte par le module user, puis envoi du lien de vérification.
 *
 * La création elle-même et ses invariants d'unicité appartiennent à
 * RegisterUserUseCase : auth n'a pas accès au repository de user.
 */
@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    @Inject(EMAIL_VERIFICATION_TOKEN_REPOSITORY)
    private readonly verificationRepo: EmailVerificationTokenRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
    @Inject(EMAIL_SENDER) private readonly emailSender: EmailSenderPort,
  ) {}

  async execute(dto: RegisterDto): Promise<PublicUser> {
    const user = await this.registerUser.execute({
      email: dto.email,
      displayName: dto.displayName,
      passwordHash: await this.passwordHasher.hash(dto.password),
    });

    await this.sendVerificationLink(user, dto.appOrigin);

    return user;
  }

  private async sendVerificationLink(
    user: PublicUser,
    appOrigin: string,
  ): Promise<void> {
    const { token, plainToken } = EmailVerificationToken.issue(
      UserId.create(user.id),
    );
    await this.verificationRepo.save(token);

    await this.emailSender.sendVerificationEmail(
      user.email,
      `${appOrigin}/verify-email?token=${plainToken}`,
    );
  }
}
