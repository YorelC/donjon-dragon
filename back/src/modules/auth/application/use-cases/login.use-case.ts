import { Inject, Injectable } from '@nestjs/common';
import type { LoginDto, User } from '@donjon-dragon/shared/user-schema';
import type { AuthTokens } from '@donjon-dragon/shared/auth-schema';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '@modules/user/application/ports/user-repository.port';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepositoryPort,
} from '../ports/refresh-token.repository.port';
import { PASSWORD_HASHER, type PasswordHasherPort } from '../ports/password-hasher.port';
import { TOKEN_SERVICE, type TokenServicePort } from '../ports/token-service.port';
import { InvalidCredentialsError, EmailNotVerifiedError } from '../../domain/auth.errors';
import { toPublicUser } from '@modules/user/domain/user.entity';
import { createRefreshTokenRecord } from '../../domain/token/refresh-token.entity';
import { createAccessTokenPayload } from '../../domain/token/access-token-payload';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshRepo: RefreshTokenRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenServicePort,
  ) {}

  async execute(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.authenticate(dto);
    return this.issueTokens(user);
  }

  private async authenticate(dto: LoginDto): Promise<User> {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) throw new InvalidCredentialsError();

    const validPassword = await this.passwordHasher.verify(
      dto.password,
      user.passwordHash,
    );
    if (!validPassword) throw new InvalidCredentialsError();

    if (!user.emailVerified) throw new EmailNotVerifiedError();

    return user;
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const accessToken = this.tokenService.signAccessToken(
      createAccessTokenPayload(user.id),
    );

    const { record, plainToken } = createRefreshTokenRecord(user.id);
    await this.refreshRepo.save(record);

    return {
      accessToken,
      refreshToken: plainToken,
      user: toPublicUser(user),
    };
  }
}
