import { Inject, Injectable } from '@nestjs/common';
import type { IssuedSession } from '../issued-session';
import { UserId } from '@kernel/domain/user-id';

import { GetUserProfileUseCase } from '@modules/user/application/use-cases/get-user-profile.use-case';
import { UserNotFoundError } from '@modules/user/domain/user.errors';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepositoryPort,
} from '../ports/refresh-token.repository.port';
import { TOKEN_SERVICE, type TokenServicePort } from '../ports/token-service.port';
import {
  InvalidRefreshTokenError,
  RefreshRaceError,
  TokenReuseDetectedError,
  RefreshTokenExpiredError,
} from '../../domain/auth.errors';
import { REFRESH_GRACE_MS, RefreshToken } from '../../domain/token/refresh-token';
import { TokenSecret } from '../../domain/token-secret';
import { createAccessTokenPayload } from '../../domain/token/access-token-payload';

@Injectable()
export class RefreshTokensUseCase {
  constructor(
    private readonly getUserProfile: GetUserProfileUseCase,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshRepo: RefreshTokenRepositoryPort,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenServicePort,
  ) {}

  async execute(plainToken: string): Promise<IssuedSession> {
    const presented = await this.consumePresentedToken(plainToken);
    const rotated = await this.rotate(presented);

    const user = await this.getUserProfile.ownProfile(presented.userId.value);
    if (!user) throw new UserNotFoundError();

    return {
      accessToken: this.tokenService.signAccessToken(
        createAccessTokenPayload(presented.userId),
      ),
      refreshToken: rotated,
      user,
    };
  }

  /**
   * Valide le token présenté et le consomme.
   *
   * Un token déjà révoqué a deux causes possibles, et les confondre est coûteux
   * dans les deux sens : traiter une course comme une fuite déconnecte un
   * utilisateur légitime, traiter une fuite comme une course laisse un attaquant
   * en place. La fenêtre de grâce les sépare — juste après la rotation, c'est une
   * concurrence entre onglets ; plus tard, c'est un secret qui a circulé.
   */
  private async consumePresentedToken(plainToken: string): Promise<RefreshToken> {
    const now = new Date();
    const token = await this.refreshRepo.findBySecret(
      TokenSecret.fromPlain(plainToken),
    );
    if (!token) throw new InvalidRefreshTokenError();

    if (token.isRevoked) {
      // La lignée reste vivante : l'appelant réessaie et obtient le token issu
      // de la rotation qui a gagné la course.
      if (token.isRecentRotation(REFRESH_GRACE_MS, now)) throw new RefreshRaceError();

      await this.refreshRepo.revokeFamily(token.familyId);
      throw new TokenReuseDetectedError();
    }

    if (token.isExpired(now)) throw new RefreshTokenExpiredError();

    token.revoke();
    await this.refreshRepo.save(token);

    return token;
  }

  /** Nouveau token dans la MÊME lignée : c'est ce qui rend la fuite détectable. */
  private async rotate(consumed: RefreshToken): Promise<string> {
    const { token, plainToken } = RefreshToken.issue(
      UserId.create(consumed.userId.value),
      consumed.familyId,
    );
    await this.refreshRepo.save(token);

    return plainToken;
  }
}
