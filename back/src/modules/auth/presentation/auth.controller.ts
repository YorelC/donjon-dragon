import { Controller, Post, HttpCode, Inject } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  LoginSchema,
  RegisterSchema,
  type LoginDto,
  type RegisterDto,
} from '@donjon-dragon/shared/user-schema';
import {
  RefreshSchema,
  VerifyEmailSchema,
  type RefreshDto,
  type TokenPayload,
  type VerifyEmailDto,
} from '@donjon-dragon/shared/auth-schema';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { ZodBody } from '@common/decorators/zod-validated.decorator';
import { RegisterUseCase } from '../application/use-cases/register.use-case';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { VerifyEmailUseCase } from '../application/use-cases/verify-email.use-case';
import { RefreshTokensUseCase } from '../application/use-cases/refresh-tokens.use-case';
import { LogoutUseCase } from '../application/use-cases/logout.use-case';

/**
 * Traduction HTTP seule. Les erreurs métier remontent telles quelles : le
 * DomainExceptionFilter (APP_FILTER) les convertit en statut. Les routes non
 * annotées @Public() sont protégées par le JwtAuthGuard global.
 */
// Routes non authentifiées et devinables : elles se prêtent à la force brute
// (mot de passe) et à l'énumération (email déjà pris). D'où une limite bien
// plus serrée que le garde-fou global.
const AUTH_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(RegisterUseCase) private registerUseCase: RegisterUseCase,
    @Inject(LoginUseCase) private loginUseCase: LoginUseCase,
    @Inject(VerifyEmailUseCase) private verifyEmailUseCase: VerifyEmailUseCase,
    @Inject(RefreshTokensUseCase) private refreshTokensUseCase: RefreshTokensUseCase,
    @Inject(LogoutUseCase) private logoutUseCase: LogoutUseCase,
  ) {}

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('register')
  async register(@ZodBody(RegisterSchema) dto: RegisterDto) {
    return this.registerUseCase.execute(dto);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('login')
  async login(@ZodBody(LoginSchema) dto: LoginDto) {
    return this.loginUseCase.execute(dto);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('verify-email')
  async verifyEmail(@ZodBody(VerifyEmailSchema) dto: VerifyEmailDto) {
    return this.verifyEmailUseCase.execute(dto.token);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('refresh')
  async refresh(@ZodBody(RefreshSchema) dto: RefreshDto) {
    return this.refreshTokensUseCase.execute(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @CurrentUser() user: TokenPayload,
    @ZodBody(RefreshSchema) dto: RefreshDto,
  ) {
    await this.logoutUseCase.execute(user.userId, dto.refreshToken);
  }
}
