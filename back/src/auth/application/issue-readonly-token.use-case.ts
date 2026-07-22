import type { UserRepositoryPort } from '../../user/domain/user.repository.port';
import type { TokenServicePort } from '../domain/token-service.port';
import { UserNotFoundError } from '../domain/auth.errors';

export class IssueReadonlyTokenUseCase {
  constructor(
    private readonly userRepo: UserRepositoryPort,
    private readonly tokenService: TokenServicePort,
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
