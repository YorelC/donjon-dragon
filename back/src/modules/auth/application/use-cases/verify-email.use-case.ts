import { Inject, Injectable } from '@nestjs/common';
import type {
  AuthTokens,
  EmailVerificationTokenRecord,
} from '@donjon-dragon/shared/auth-schema';
import type { PublicUser } from '@donjon-dragon/shared/user-schema';

import { MarkEmailVerifiedUseCase } from '@modules/user/application/use-cases/mark-email-verified.use-case';
import {
  EMAIL_VERIFICATION_TOKEN_REPOSITORY,
  type EmailVerificationTokenRepositoryPort,
} from '../ports/email-verification-token.repository.port';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepositoryPort,
} from '../ports/refresh-token.repository.port';
import { TOKEN_SERVICE, type TokenServicePort } from '../ports/token-service.port';
import {
  InvalidVerificationTokenError,
  VerificationTokenExpiredError,
} from '../../domain/auth.errors';
import {
  hashVerificationToken,
  isExpired,
} from '../../domain/email/email-verification-token.entity';
import { createRefreshTokenRecord } from '../../domain/token/refresh-token.entity';
import { createAccessTokenPayload } from '../../domain/token/access-token-payload';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    private readonly markEmailVerified: MarkEmailVerifiedUseCase,
    @Inject(EMAIL_VERIFICATION_TOKEN_REPOSITORY)
    private readonly verificationRepo: EmailVerificationTokenRepositoryPort,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshRepo: RefreshTokenRepositoryPort,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenServicePort,
  ) {}

  async execute(plainToken: string): Promise<AuthTokens> {
    const record = await this.readVerificationToken(plainToken);
    // La transition appartient à user ; auth ne fait que la déclencher.
    const verifiedUser = await this.markEmailVerified.execute(record.userId);
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

  private async issueTokens(user: PublicUser): Promise<AuthTokens> {
    const accessToken = this.tokenService.signAccessToken(
      createAccessTokenPayload(user.id),
    );

    const { record, plainToken } = createRefreshTokenRecord(user.id);
    await this.refreshRepo.save(record);

    return { accessToken, refreshToken: plainToken, user };
  }
}
