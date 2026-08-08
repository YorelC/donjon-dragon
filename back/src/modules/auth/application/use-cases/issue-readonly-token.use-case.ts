import { Inject, Injectable } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '@modules/user/application/ports/user-repository.port';
import { TOKEN_SERVICE, type TokenServicePort } from '../ports/token-service.port';
import { UserNotFoundError } from '../../domain/auth.errors';

@Injectable()
export class IssueReadonlyTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenServicePort,
  ) {}

  async execute(userId: string): Promise<{ accessToken: string }> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new UserNotFoundError();

    const payload = {
      userId: user.id,
      role: 'player' as const,
      tier: 'readonly' as const,
    };
    const accessToken = this.tokenService.signAccessToken(payload);

    return { accessToken };
  }
}
