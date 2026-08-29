import { Inject, Injectable } from '@nestjs/common';
import type { IssuedSession } from '../issued-session';
import type { PublicUser } from '@donjon-dragon/shared/user-schema';
import { UserId } from '@kernel/domain/user-id';
import { CLOCK, type Clock } from '@kernel/application/clock.port';

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
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(plainToken: string): Promise<IssuedSession> {
    // Un seul instant pour toute l'opération : le lien vérifié à la milliseconde
    // près et le refresh token qu'il ouvre doivent dater du même moment.
    const now = this.clock.now();
    const token = await this.readVerificationToken(plainToken, now);
    // Consommer AVANT de vérifier : entre la lecture et la suppression, deux
    // requêtes concurrentes tenaient toutes deux un token valide. Seule celle
    // qui supprime effectivement le document poursuit.
    //
    // LIMITE CONNUE, non résolue ici : si `markEmailVerified` échoue ensuite, le
    // lien est perdu et le compte reste non vérifié, sans route de renvoi. Les
    // deux écritures vivent dans deux modules et deux collections ; les rendre
    // solidaires demande une transaction Mongo ou une procédure de renvoi
    // explicite — un arbitrage qui appartient au propriétaire du projet, pas à
    // ce use-case. La course est réglée, la cohérence sur panne ne l'est pas.
    if (!(await this.verificationRepo.consume(token))) {
      throw new InvalidVerificationTokenError();
    }
    // La transition appartient à user ; auth ne fait que la déclencher.
    const verifiedUser = await this.markEmailVerified.execute(token.userId.value);

    return this.issueTokens(verifiedUser, now);
  }

  private async readVerificationToken(
    plainToken: string,
    now: Date,
  ): Promise<EmailVerificationToken> {
    const token = await this.verificationRepo.findBySecret(
      TokenSecret.fromPlain(plainToken),
    );
    if (!token) throw new InvalidVerificationTokenError();

    if (token.isExpired(now)) throw new VerificationTokenExpiredError();

    return token;
  }

  private async issueTokens(user: PublicUser, now: Date): Promise<IssuedSession> {
    const userId = UserId.create(user.id);

    const { token, plainToken } = RefreshToken.issue(userId, now);
    await this.refreshRepo.save(token);

    return {
      accessToken: this.tokenService.signAccessToken(createAccessTokenPayload(userId)),
      refreshToken: plainToken,
      user,
    };
  }
}
