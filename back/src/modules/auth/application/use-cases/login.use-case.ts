import { Inject, Injectable } from '@nestjs/common';
import type { LoginDto, PublicUser } from '@donjon-dragon/shared/user-schema';
import type { AuthTokens } from '@donjon-dragon/shared/auth-schema';
import { UserId } from '@kernel/domain/user-id';

import { GetUserCredentialsUseCase } from '@modules/user/application/use-cases/get-user-credentials.use-case';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepositoryPort,
} from '../ports/refresh-token.repository.port';
import { PASSWORD_HASHER, type PasswordHasherPort } from '../ports/password-hasher.port';
import { TOKEN_SERVICE, type TokenServicePort } from '../ports/token-service.port';
import { InvalidCredentialsError, EmailNotVerifiedError } from '../../domain/auth.errors';
import { RefreshToken } from '../../domain/token/refresh-token';
import { createAccessTokenPayload } from '../../domain/token/access-token-payload';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly getUserCredentials: GetUserCredentialsUseCase,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshRepo: RefreshTokenRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenServicePort,
  ) {}

  async execute(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.authenticate(dto);
    return this.issueTokens(user);
  }

  private async authenticate(dto: LoginDto): Promise<PublicUser> {
    const credentials = await this.getUserCredentials.execute(dto.email);
    if (!credentials) throw new InvalidCredentialsError();

    const validPassword = await this.passwordHasher.verify(
      dto.password,
      credentials.passwordHash,
    );
    if (!validPassword) throw new InvalidCredentialsError();

    if (!credentials.profile.emailVerified) throw new EmailNotVerifiedError();

    return credentials.profile;
  }

  /** Nouvelle connexion : nouvelle lignée de refresh tokens. */
  private async issueTokens(user: PublicUser): Promise<AuthTokens> {
    const userId = UserId.create(user.id);

    const { token, plainToken } = RefreshToken.issue(userId);
    await this.refreshRepo.save(token);

    return {
      accessToken: this.tokenService.signAccessToken(createAccessTokenPayload(userId)),
      refreshToken: plainToken,
      user,
    };
  }
}
