import type { AuthTokens } from '@donjon-dragon/shared/auth-schema';
import type { UserRepositoryPort } from '../../user/domain/user.repository.port';
import type { EmailVerificationTokenRepositoryPort } from '../domain/email-verification-token.repository.port';
import type { RefreshTokenRepositoryPort } from '../domain/refresh-token.repository.port';
import type { TokenServicePort } from '../domain/token-service.port';
import {
  InvalidVerificationTokenError,
  VerificationTokenExpiredError,
  UserNotFoundError,
} from '../domain/auth.errors';
import {
  hashVerificationToken,
  isExpired,
} from '../domain/email-verification-token.entity.js';
import { toPublicUser } from '../../user/domain/user.entity';
import { createRefreshTokenRecord } from '../domain/refresh-token.entity';

export class VerifyEmailUseCase {
  constructor(
    private readonly userRepo: UserRepositoryPort,
    private readonly verificationRepo: EmailVerificationTokenRepositoryPort,
    private readonly refreshRepo: RefreshTokenRepositoryPort,
    private readonly tokenService: TokenServicePort,
  ) {}

  async execute(plainToken: string): Promise<AuthTokens> {
    const tokenHash = hashVerificationToken(plainToken);
    const record = await this.verificationRepo.findByTokenHash(tokenHash);
    if (!record) throw new InvalidVerificationTokenError();

    if (isExpired(record, new Date())) {
      throw new VerificationTokenExpiredError();
    }

    const user = await this.userRepo.findById(record.userId);
    if (!user) throw new UserNotFoundError();

    const updated = { ...user, emailVerified: true as const };
    await this.userRepo.save(updated);

    await this.verificationRepo.deleteById(record.id);

    const payload = {
      userId: user.id,
      role: 'player' as const,
      tier: 'full' as const,
    };
    const accessToken = this.tokenService.signAccessToken(payload);

    const { record: refreshRecord, plainToken: refreshToken } =
      createRefreshTokenRecord(user.id);
    await this.refreshRepo.save(refreshRecord);

    return {
      accessToken,
      refreshToken,
      user: toPublicUser(updated),
    };
  }
}
