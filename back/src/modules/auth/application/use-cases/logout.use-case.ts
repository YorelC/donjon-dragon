import { Inject, Injectable } from '@nestjs/common';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepositoryPort,
} from '../ports/refresh-token.repository.port';
import { hashRefreshToken } from '../../domain/token/refresh-token.entity';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshRepo: RefreshTokenRepositoryPort,
  ) {}

  async execute(plainToken: string): Promise<void> {
    const tokenHash = hashRefreshToken(plainToken);
    const record = await this.refreshRepo.findByTokenHash(tokenHash);
    if (record) {
      await this.refreshRepo.revokeFamily(record.familyId);
    }
  }
}
