import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import type { RegisterDto, LoginDto } from '@donjon-dragon/shared/user-schema';
import type { RefreshDto, VerifyEmailDto } from '@donjon-dragon/shared/auth-schema';
import {
  EmailAlreadyInUseError,
  InvalidCredentialsError,
  EmailNotVerifiedError,
  InvalidVerificationTokenError,
  VerificationTokenExpiredError,
  InvalidRefreshTokenError,
  TokenReuseDetectedError,
  RefreshTokenExpiredError,
  UserNotFoundError,
} from '../domain/auth.errors';
import { DisplayNameAlreadyTakenError } from '@modules/user/domain/user.errors';
import { RegisterUseCase } from '../application/use-cases/register.use-case';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { VerifyEmailUseCase } from '../application/use-cases/verify-email.use-case';
import { RefreshTokensUseCase } from '../application/use-cases/refresh-tokens.use-case';
import { LogoutUseCase } from '../application/use-cases/logout.use-case';
import { IssueReadonlyTokenUseCase } from '../application/use-cases/issue-readonly-token.use-case';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { TokenPayload } from '@donjon-dragon/shared/auth-schema';

@Controller('api/auth')
export class AuthController {
  constructor(
    @Inject(RegisterUseCase) private registerUseCase: RegisterUseCase,
    @Inject(LoginUseCase) private loginUseCase: LoginUseCase,
    @Inject(VerifyEmailUseCase) private verifyEmailUseCase: VerifyEmailUseCase,
    @Inject(RefreshTokensUseCase) private refreshTokensUseCase: RefreshTokensUseCase,
    @Inject(LogoutUseCase) private logoutUseCase: LogoutUseCase,
    @Inject(IssueReadonlyTokenUseCase)
    private issueReadonlyTokenUseCase: IssueReadonlyTokenUseCase,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    try {
      return await this.registerUseCase.execute(dto);
    } catch (err) {
      if (err instanceof EmailAlreadyInUseError || err instanceof DisplayNameAlreadyTakenError) {
        throw new ConflictException(err.message);
      }
      throw err;
    }
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    try {
      return await this.loginUseCase.execute(dto);
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        throw new UnauthorizedException(err.message);
      }
      if (err instanceof EmailNotVerifiedError) {
        throw new ForbiddenException(err.message);
      }
      throw err;
    }
  }

  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    try {
      return await this.verifyEmailUseCase.execute(dto.token);
    } catch (err) {
      if (
        err instanceof InvalidVerificationTokenError ||
        err instanceof VerificationTokenExpiredError
      ) {
        throw new UnauthorizedException(err.message);
      }
      if (err instanceof UserNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    try {
      return await this.refreshTokensUseCase.execute(dto.refreshToken);
    } catch (err) {
      if (
        err instanceof InvalidRefreshTokenError ||
        err instanceof TokenReuseDetectedError ||
        err instanceof RefreshTokenExpiredError
      ) {
        throw new UnauthorizedException(err.message);
      }
      throw err;
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async logout(@Body() dto: RefreshDto) {
    await this.logoutUseCase.execute(dto.refreshToken);
  }

  @Post('readonly-token')
  @UseGuards(JwtAuthGuard)
  async readonlyToken(@CurrentUser() user: TokenPayload) {
    try {
      return await this.issueReadonlyTokenUseCase.execute(user.userId);
    } catch (err) {
      if (err instanceof UserNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }
  }
}
