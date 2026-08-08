import type { RegisterDto, PublicUser } from '@donjon-dragon/shared/user-schema';
import type { UserRepositoryPort } from '@modules/user/application/ports/user-repository.port';
import type { EmailVerificationTokenRepositoryPort } from '../ports/email-verification-token.repository.port';
import type { PasswordHasherPort } from '../ports/password-hasher.port';
import type { EmailSenderPort } from '../ports/email-sender.port';
import { EmailAlreadyInUseError } from '../../domain/auth.errors';
import { DisplayNameAlreadyTakenError } from '@modules/user/domain/user.errors';
import { createEmailVerificationToken } from '../../domain/email/email-verification-token.entity';
import { createUser, toPublicUser } from '@modules/user/domain/user.entity';

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
