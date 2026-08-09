import { Inject, Injectable } from '@nestjs/common';
import { UserId } from '@kernel/domain/user-id';

import { GetUserProfileUseCase } from '@modules/user/application/use-cases/get-user-profile.use-case';
import { UserNotFoundError } from '@modules/user/domain/user.errors';
import { TOKEN_SERVICE, type TokenServicePort } from '../ports/token-service.port';
import { createReadonlyTokenPayload } from '../../domain/token/access-token-payload';

@Injectable()
export class IssueReadonlyTokenUseCase {
  constructor(
    private readonly getUserProfile: GetUserProfileUseCase,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenServicePort,
  ) {}

  async execute(userId: string): Promise<{ accessToken: string }> {
    const user = await this.getUserProfile.ownProfile(userId);
    if (!user) throw new UserNotFoundError();

    return {
      accessToken: this.tokenService.signAccessToken(
        createReadonlyTokenPayload(UserId.create(user.id)),
      ),
    };
  }
}
