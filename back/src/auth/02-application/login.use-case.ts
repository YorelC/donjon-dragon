import type { LoginDto } from '@donjon-dragon/shared/user-schema';
import type { AuthTokens } from '@donjon-dragon/shared/auth-schema';
import type { UserRepositoryPort } from '../../user/03-domain/user.repository.port';
import type { RefreshTokenRepositoryPort } from '../03-domain/token/refresh-token.repository.port';
import type { PasswordHasherPort } from '../03-domain/password-hasher.port';
import type { TokenServicePort } from '../03-domain/token/token-service.port';
import { InvalidCredentialsError, EmailNotVerifiedError } from '../03-domain/auth.errors';
import { toPublicUser } from '../../user/03-domain/user.entity';
import { createRefreshTokenRecord } from '../03-domain/token/refresh-token.entity';

export class LoginUseCase {
  constructor(
    private readonly userRepo: UserRepositoryPort,
    private readonly refreshRepo: RefreshTokenRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly tokenService: TokenServicePort,
  ) {}

  async execute(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) throw new InvalidCredentialsError();

    const validPassword = await this.passwordHasher.verify(
      dto.password,
      user.passwordHash,
    );
    if (!validPassword) throw new InvalidCredentialsError();

    if (!user.emailVerified) throw new EmailNotVerifiedError();

    const payload = {
      userId: user.id,
      role: 'player' as const,
      tier: 'full' as const,
    };
    const accessToken = this.tokenService.signAccessToken(payload);

    const { record, plainToken } = createRefreshTokenRecord(user.id);
    await this.refreshRepo.save(record);

    return {
      accessToken,
      refreshToken: plainToken,
      user: toPublicUser(user),
    };
  }
}
