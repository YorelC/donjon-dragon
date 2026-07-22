import type { RegisterDto } from '@donjon-dragon/shared/user-schema';
import type { AuthTokens } from '@donjon-dragon/shared/auth-schema';
import type { UserRepositoryPort } from '../../user/domain/user.repository.port';
import type { RefreshTokenRepositoryPort } from '../domain/refresh-token.repository.port';
import type { PasswordHasherPort } from '../domain/password-hasher.port';
import type { TokenServicePort } from '../domain/token-service.port';
import { EmailAlreadyInUseError } from '../domain/auth.errors';
import { createUser, toPublicUser } from '../../user/domain/user.entity';
import { createRefreshTokenRecord } from '../domain/refresh-token.entity';

export class RegisterUseCase {
  constructor(
    private readonly userRepo: UserRepositoryPort,
    private readonly refreshRepo: RefreshTokenRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly tokenService: TokenServicePort,
  ) {}

  async execute(dto: RegisterDto): Promise<AuthTokens> {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) throw new EmailAlreadyInUseError();

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const user = createUser({
      email: dto.email,
      displayName: dto.displayName,
      passwordHash,
    });
    await this.userRepo.save(user);

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
