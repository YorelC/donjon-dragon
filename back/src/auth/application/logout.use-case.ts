import type { RefreshTokenRepositoryPort } from '../domain/refresh-token.repository.port';
import { hashRefreshToken } from '../domain/refresh-token.entity';

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
