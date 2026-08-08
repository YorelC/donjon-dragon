import type {
  AuthTokens,
  EmailVerificationTokenRecord,
} from '@donjon-dragon/shared/auth-schema';
import type { User } from '@donjon-dragon/shared/user-schema';
import type { UserRepositoryPort } from '@modules/user/application/ports/user-repository.port';
import type { EmailVerificationTokenRepositoryPort } from '../ports/email-verification-token.repository.port';
import type { RefreshTokenRepositoryPort } from '../ports/refresh-token.repository.port';
import type { TokenServicePort } from '../ports/token-service.port';
import {
  InvalidVerificationTokenError,
  VerificationTokenExpiredError,
  UserNotFoundError,
} from '../../domain/auth.errors';
import {
  hashVerificationToken,
  isExpired,
} from '../../domain/email/email-verification-token.entity';
import { toPublicUser } from '@modules/user/domain/user.entity';
import { createRefreshTokenRecord } from '../../domain/token/refresh-token.entity';
import { createAccessTokenPayload } from '../../domain/token/access-token-payload';

export class VerifyEmailUseCase {
  constructor(
    private readonly userRepo: UserRepositoryPort,
    private readonly verificationRepo: EmailVerificationTokenRepositoryPort,
    private readonly refreshRepo: RefreshTokenRepositoryPort,
    private readonly tokenService: TokenServicePort,
  ) {}

  async execute(plainToken: string): Promise<AuthTokens> {
    const record = await this.readVerificationToken(plainToken);
    const verifiedUser = await this.markEmailVerified(record.userId);
    await this.verificationRepo.deleteById(record.id);

    return this.issueTokens(verifiedUser);
  }

  private async readVerificationToken(
    plainToken: string,
  ): Promise<EmailVerificationTokenRecord> {
    const tokenHash = hashVerificationToken(plainToken);
    const record = await this.verificationRepo.findByTokenHash(tokenHash);
    if (!record) throw new InvalidVerificationTokenError();

    if (isExpired(record, new Date())) {
      throw new VerificationTokenExpiredError();
    }

    return record;
  }

  private async markEmailVerified(userId: string): Promise<User> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new UserNotFoundError();

    const verified = { ...user, emailVerified: true as const };
    await this.userRepo.save(verified);

    return verified;
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const accessToken = this.tokenService.signAccessToken(
      createAccessTokenPayload(user.id),
    );

    const { record, plainToken } = createRefreshTokenRecord(user.id);
    await this.refreshRepo.save(record);

    return {
      accessToken,
      refreshToken: plainToken,
      user: toPublicUser(user),
    };
  }
}
