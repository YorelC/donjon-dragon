import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { RefreshTokenRecord } from '@donjon-dragon/shared/auth-schema';

import { UserModule } from '../../user/interface/user.module';
import { USER_REPOSITORY } from '../../user/interface/user.module';
import type { UserRepositoryPort } from '../../user/domain/user.repository.port';
import type { RefreshTokenRepositoryPort } from '../domain/refresh-token.repository.port';
import type { PasswordHasherPort } from '../domain/password-hasher.port';
import type { TokenServicePort } from '../domain/token-service.port';
import { BcryptPasswordHasher } from '../infrastructure/bcrypt-password-hasher';
import { JwtTokenService } from '../infrastructure/jwt-token.service';
import { MongoRefreshTokenRepository } from '../infrastructure/mongo-refresh-token.repository';
import { REFRESH_TOKEN_MODEL, RefreshTokenSchema } from '../infrastructure/refresh-token.schema';
import { RegisterUseCase } from '../application/register.use-case';
import { LoginUseCase } from '../application/login.use-case';
import { RefreshTokensUseCase } from '../application/refresh-tokens.use-case';
import { LogoutUseCase } from '../application/logout.use-case';
import { IssueReadonlyTokenUseCase } from '../application/issue-readonly-token.use-case';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TierGuard } from './tier.guard';
import { PASSWORD_HASHER, TOKEN_SERVICE, REFRESH_TOKEN_REPOSITORY } from './auth.tokens';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';

@Module({
  imports: [
    UserModule,
    JwtModule.register({ secret: JWT_SECRET }),
    MongooseModule.forFeature([{ name: REFRESH_TOKEN_MODEL, schema: RefreshTokenSchema }]),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: PASSWORD_HASHER,
      useClass: BcryptPasswordHasher,
    },
    {
      provide: TOKEN_SERVICE,
      useClass: JwtTokenService,
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useFactory: (model: Model<RefreshTokenRecord>) =>
        new MongoRefreshTokenRepository(model),
      inject: [getModelToken(REFRESH_TOKEN_MODEL)],
    },
    {
      provide: RegisterUseCase,
      useFactory: (
        userRepo: UserRepositoryPort,
        refreshRepo: RefreshTokenRepositoryPort,
        passwordHasher: PasswordHasherPort,
        tokenService: TokenServicePort,
      ) => new RegisterUseCase(userRepo, refreshRepo, passwordHasher, tokenService),
      inject: [USER_REPOSITORY, REFRESH_TOKEN_REPOSITORY, PASSWORD_HASHER, TOKEN_SERVICE],
    },
    {
      provide: LoginUseCase,
      useFactory: (
        userRepo: UserRepositoryPort,
        refreshRepo: RefreshTokenRepositoryPort,
        passwordHasher: PasswordHasherPort,
        tokenService: TokenServicePort,
      ) => new LoginUseCase(userRepo, refreshRepo, passwordHasher, tokenService),
      inject: [USER_REPOSITORY, REFRESH_TOKEN_REPOSITORY, PASSWORD_HASHER, TOKEN_SERVICE],
    },
    {
      provide: RefreshTokensUseCase,
      useFactory: (
        userRepo: UserRepositoryPort,
        refreshRepo: RefreshTokenRepositoryPort,
        tokenService: TokenServicePort,
      ) => new RefreshTokensUseCase(userRepo, refreshRepo, tokenService),
      inject: [USER_REPOSITORY, REFRESH_TOKEN_REPOSITORY, TOKEN_SERVICE],
    },
    {
      provide: LogoutUseCase,
      useFactory: (refreshRepo: RefreshTokenRepositoryPort) =>
        new LogoutUseCase(refreshRepo),
      inject: [REFRESH_TOKEN_REPOSITORY],
    },
    {
      provide: IssueReadonlyTokenUseCase,
      useFactory: (userRepo: UserRepositoryPort, tokenService: TokenServicePort) =>
        new IssueReadonlyTokenUseCase(userRepo, tokenService),
      inject: [USER_REPOSITORY, TOKEN_SERVICE],
    },
    JwtAuthGuard,
    TierGuard,
  ],
  exports: [TOKEN_SERVICE, JwtAuthGuard, TierGuard],
})
export class AuthModule {}
