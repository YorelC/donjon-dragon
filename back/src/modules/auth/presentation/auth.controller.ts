import {
  Controller,
  Post,
  Get,
  HttpCode,
  Inject,
  Req,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import {
  LoginSchema,
  RegisterSchema,
  type LoginDto,
  type PublicUser,
  type RegisterDto,
} from '@donjon-dragon/shared/user-schema';
import {
  VerifyEmailSchema,
  type AuthSession,
  type VerifyEmailDto,
} from '@donjon-dragon/shared/auth-schema';
import type { AuthenticatedActor } from '@kernel/domain/actor-id';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { ZodBody } from '@common/decorators/zod-validated.decorator';
import type { IssuedSession } from '../application/issued-session';
import { RegisterUseCase } from '../application/use-cases/register.use-case';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { VerifyEmailUseCase } from '../application/use-cases/verify-email.use-case';
import { RefreshTokensUseCase } from '../application/use-cases/refresh-tokens.use-case';
import { LogoutUseCase } from '../application/use-cases/logout.use-case';
import { GetUserProfileUseCase } from '@modules/user/application/use-cases/get-user-profile.use-case';
import { UserNotFoundError } from '@modules/user/domain/user.errors';
import { SessionCookies } from './session-cookies';

// Routes non authentifiées et devinables : elles se prêtent à la force brute
// (mot de passe) et à l'énumération (email déjà pris). D'où une limite bien
// plus serrée que le garde-fou global.
const AUTH_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

/**
 * Traduction HTTP seule. Les erreurs métier remontent telles quelles : le
 * DomainExceptionFilter (APP_FILTER) les convertit en statut. Les routes non
 * annotées @Public() sont protégées par le JwtAuthGuard global.
 *
 * Les secrets de session ne figurent JAMAIS dans le corps d'une réponse : c'est
 * ici, et seulement ici, qu'ils deviennent des cookies `httpOnly`.
 */
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(RegisterUseCase) private registerUseCase: RegisterUseCase,
    @Inject(LoginUseCase) private loginUseCase: LoginUseCase,
    @Inject(VerifyEmailUseCase) private verifyEmailUseCase: VerifyEmailUseCase,
    @Inject(RefreshTokensUseCase) private refreshTokensUseCase: RefreshTokensUseCase,
    @Inject(LogoutUseCase) private logoutUseCase: LogoutUseCase,
    @Inject(GetUserProfileUseCase) private getUserProfile: GetUserProfileUseCase,
    private readonly cookies: SessionCookies,
  ) {}

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('register')
  async register(@ZodBody(RegisterSchema) dto: RegisterDto): Promise<PublicUser> {
    return this.registerUseCase.execute(dto);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('login')
  async login(
    @ZodBody(LoginSchema) dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSession> {
    return this.openSession(await this.loginUseCase.execute(dto), response);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('verify-email')
  async verifyEmail(
    @ZodBody(VerifyEmailSchema) dto: VerifyEmailDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSession> {
    return this.openSession(await this.verifyEmailUseCase.execute(dto.token), response);
  }

  /**
   * Pas de corps : le refresh token arrive par cookie. @Public() parce que
   * l'access token est justement expiré — la preuve d'identité, c'est le cookie.
   */
  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSession> {
    const presented = SessionCookies.presentedRefreshToken(request);
    return this.openSession(await this.refreshTokensUseCase.execute(presented), response);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @CurrentUser() user: AuthenticatedActor,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.logoutUseCase.execute(
      user.userId,
      SessionCookies.presentedRefreshToken(request),
    );
    this.cookies.clear(response);
  }

  /**
   * Le front ne peut plus lire les cookies : c'est cette route qui lui dit s'il a
   * une session, et qui lui rend un profil à jour à chaque chargement de page.
   */
  @Get('me')
  async me(@CurrentUser() user: AuthenticatedActor): Promise<PublicUser> {
    const profile = await this.getUserProfile.ownProfile(user.userId);
    if (!profile) throw new UserNotFoundError();

    return profile;
  }

  private openSession(session: IssuedSession, response: Response): AuthSession {
    this.cookies.issue(
      response,
      session.user.id,
      session.refreshToken,
      session.accessToken,
    );

    return { user: session.user };
  }
}
