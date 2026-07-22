import type { LoginDto } from '@donjon-dragon/shared/user-schema';
import type { AuthTokens } from '@donjon-dragon/shared/auth-schema';
import type { UserRepositoryPort } from '../../user/domain/user.repository.port';
import type { RefreshTokenRepositoryPort } from '../domain/refresh-token.repository.port';
import type { PasswordHasherPort } from '../domain/password-hasher.port';
import type { TokenServicePort } from '../domain/token-service.port';
import { InvalidCredentialsError } from '../domain/auth.errors';
import { toPublicUser } from '../../user/domain/user.entity';
import { createRefreshTokenRecord } from '../domain/refresh-token.entity';

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
