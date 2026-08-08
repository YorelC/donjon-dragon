import type {
  AuthTokens,
  RefreshTokenRecord,
} from '@donjon-dragon/shared/auth-schema';
import type { UserRepositoryPort } from '@modules/user/application/ports/user-repository.port';
import type { RefreshTokenRepositoryPort } from '../ports/refresh-token.repository.port';
import type { TokenServicePort } from '../ports/token-service.port';
import {
  InvalidRefreshTokenError,
  TokenReuseDetectedError,
  RefreshTokenExpiredError,
  UserNotFoundError,
} from '../../domain/auth.errors';
import { toPublicUser } from '@modules/user/domain/user.entity';
import {
  hashRefreshToken,
  createRefreshTokenRecord,
  isExpired,
} from '../../domain/token/refresh-token.entity';
import { createAccessTokenPayload } from '../../domain/token/access-token-payload';

export class RefreshTokensUseCase {
  constructor(
    private readonly userRepo: UserRepositoryPort,
    private readonly refreshRepo: RefreshTokenRepositoryPort,
    private readonly tokenService: TokenServicePort,
  ) {}

  async execute(plainToken: string): Promise<AuthTokens> {
    const record = await this.consumePresentedToken(plainToken);
    const newPlainToken = await this.rotate(record);

    const user = await this.userRepo.findById(record.userId);
    if (!user) throw new UserNotFoundError();

    const accessToken = this.tokenService.signAccessToken(
      createAccessTokenPayload(record.userId),
    );

    return {
      accessToken,
      refreshToken: newPlainToken,
      user: toPublicUser(user),
    };
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
