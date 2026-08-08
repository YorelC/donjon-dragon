import { Inject, Injectable } from '@nestjs/common';
import type {
  AuthTokens,
  RefreshTokenRecord,
} from '@donjon-dragon/shared/auth-schema';

import { GetUserProfileUseCase } from '@modules/user/application/use-cases/get-user-profile.use-case';
import { UserNotFoundError } from '@modules/user/domain/user.errors';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepositoryPort,
} from '../ports/refresh-token.repository.port';
import { TOKEN_SERVICE, type TokenServicePort } from '../ports/token-service.port';
import {
  InvalidRefreshTokenError,
  TokenReuseDetectedError,
  RefreshTokenExpiredError,
} from '../../domain/auth.errors';
import {
  hashRefreshToken,
  createRefreshTokenRecord,
  isExpired,
} from '../../domain/token/refresh-token.entity';
import { createAccessTokenPayload } from '../../domain/token/access-token-payload';

@Injectable()
export class RefreshTokensUseCase {
  constructor(
    private readonly getUserProfile: GetUserProfileUseCase,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshRepo: RefreshTokenRepositoryPort,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenServicePort,
  ) {}

  async execute(plainToken: string): Promise<AuthTokens> {
    const record = await this.consumePresentedToken(plainToken);
    const newPlainToken = await this.rotate(record);

    const user = await this.getUserProfile.byId(record.userId);
    if (!user) throw new UserNotFoundError();

    const accessToken = this.tokenService.signAccessToken(
      createAccessTokenPayload(record.userId),
    );

    return { accessToken, refreshToken: newPlainToken, user };
  }

  // Valide le token présenté et le révoque : toute réutilisation ultérieure
  // fera tomber la famille entière.
  private async consumePresentedToken(
    plainToken: string,
  ): Promise<RefreshTokenRecord> {
    const tokenHash = hashRefreshToken(plainToken);
    const record = await this.refreshRepo.findByTokenHash(tokenHash);
    if (!record) throw new InvalidRefreshTokenError();

    if (record.revokedAt) {
      await this.refreshRepo.revokeFamily(record.familyId);
      throw new TokenReuseDetectedError();
    }

    if (isExpired(record, new Date())) throw new RefreshTokenExpiredError();

    await this.refreshRepo.revokeById(record.id);

    return record;
  }

  private async rotate(record: RefreshTokenRecord): Promise<string> {
    const { record: newRecord, plainToken } = createRefreshTokenRecord(
      record.userId,
      record.familyId,
    );
    await this.refreshRepo.save(newRecord);

    return plainToken;
  }
}
