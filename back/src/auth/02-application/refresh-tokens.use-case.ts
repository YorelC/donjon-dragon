import type { AuthTokens } from '@donjon-dragon/shared/auth-schema';
import type { UserRepositoryPort } from '../../user/03-domain/user.repository.port';
import type { RefreshTokenRepositoryPort } from '../03-domain/token/refresh-token.repository.port';
import type { TokenServicePort } from '../03-domain/token/token-service.port';
import {
  InvalidRefreshTokenError,
  TokenReuseDetectedError,
  RefreshTokenExpiredError,
  UserNotFoundError,
} from '../03-domain/auth.errors';
import { toPublicUser } from '../../user/03-domain/user.entity';
import {
  hashRefreshToken,
  createRefreshTokenRecord,
  isExpired,
} from '../03-domain/token/refresh-token.entity';

export class RefreshTokensUseCase {
  constructor(
    private readonly userRepo: UserRepositoryPort,
    private readonly refreshRepo: RefreshTokenRepositoryPort,
    private readonly tokenService: TokenServicePort,
  ) {}

  async execute(plainToken: string): Promise<AuthTokens> {
    const tokenHash = hashRefreshToken(plainToken);
    const record = await this.refreshRepo.findByTokenHash(tokenHash);
    if (!record) throw new InvalidRefreshTokenError();

    if (record.revokedAt) {
      await this.refreshRepo.revokeFamily(record.familyId);
      throw new TokenReuseDetectedError();
    }

    if (isExpired(record, new Date())) throw new RefreshTokenExpiredError();

    await this.refreshRepo.revokeById(record.id);

    const { record: newRecord, plainToken: newPlainToken } =
      createRefreshTokenRecord(record.userId, record.familyId);
    await this.refreshRepo.save(newRecord);

    const user = await this.userRepo.findById(record.userId);
    if (!user) throw new UserNotFoundError();

    const payload = {
      userId: record.userId,
      role: 'player' as const,
      tier: 'full' as const,
    };
    const accessToken = this.tokenService.signAccessToken(payload);

    return {
      accessToken,
      refreshToken: newPlainToken,
      user: toPublicUser(user),
    };
  }
}
