import { Inject, Injectable } from '@nestjs/common';
import type { IssuedSession } from '../issued-session';
import type { PublicUser } from '@donjon-dragon/shared/user-schema';
import { UserId } from '@kernel/domain/user-id';

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
import type { EmailVerificationToken } from '../../domain/email/email-verification-token';
import { RefreshToken } from '../../domain/token/refresh-token';
import { TokenSecret } from '../../domain/token-secret';
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

  async execute(plainToken: string): Promise<IssuedSession> {
    const token = await this.readVerificationToken(plainToken);
    // La transition appartient à user ; auth ne fait que la déclencher.
    const verifiedUser = await this.markEmailVerified.execute(token.userId.value);
    // Usage unique : le lien est consommé, donc supprimé.
    await this.verificationRepo.delete(token);

    return this.issueTokens(verifiedUser);
  }

  private async readVerificationToken(
    plainToken: string,
  ): Promise<EmailVerificationToken> {
    const token = await this.verificationRepo.findBySecret(
      TokenSecret.fromPlain(plainToken),
    );
    if (!token) throw new InvalidVerificationTokenError();

    if (token.isExpired(new Date())) throw new VerificationTokenExpiredError();

    return token;
  }

  private async issueTokens(user: PublicUser): Promise<IssuedSession> {
    const userId = UserId.create(user.id);

    const { token, plainToken } = RefreshToken.issue(userId);
    await this.refreshRepo.save(token);

    return {
      accessToken: this.tokenService.signAccessToken(createAccessTokenPayload(userId)),
      refreshToken: plainToken,
      user,
    };
  }
}
