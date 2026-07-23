import type { RefreshTokenRepositoryPort } from '../03-domain/token/refresh-token.repository.port';
import { hashRefreshToken } from '../03-domain/token/refresh-token.entity';

export class LogoutUseCase {
  constructor(private readonly refreshRepo: RefreshTokenRepositoryPort) {}

  async execute(plainToken: string): Promise<void> {
    const tokenHash = hashRefreshToken(plainToken);
    const record = await this.refreshRepo.findByTokenHash(tokenHash);
    if (record) {
      await this.refreshRepo.revokeFamily(record.familyId);
    }
  }
}
