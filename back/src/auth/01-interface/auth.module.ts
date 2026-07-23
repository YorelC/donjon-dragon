import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { RefreshTokenRecord, EmailVerificationTokenRecord } from '@donjon-dragon/shared/auth-schema';

import { UserModule } from '../../user/01-interface/user.module';
import { USER_REPOSITORY } from '../../user/01-interface/user.module';
import type { UserRepositoryPort } from '../../user/03-domain/user.repository.port';
import type { RefreshTokenRepositoryPort } from '../03-domain/token/refresh-token.repository.port';
import type { EmailVerificationTokenRepositoryPort } from '../03-domain/email/email-verification-token.repository.port';
import type { PasswordHasherPort } from '../03-domain/password-hasher.port';
import type { TokenServicePort } from '../03-domain/token/token-service.port';
import type { EmailSenderPort } from '../03-domain/email/email-sender.port';
import { BcryptPasswordHasher } from '../04-infrastructure/bcrypt-password-hasher';
import { JwtTokenService } from '../04-infrastructure/token/jwt-token.service';
import { MongoRefreshTokenRepository } from '../04-infrastructure/token/mongo-refresh-token.repository';
import { REFRESH_TOKEN_MODEL, RefreshTokenSchema } from '../04-infrastructure/token/refresh-token.schema';
import { MongoEmailVerificationTokenRepository } from '../04-infrastructure/email/mongo-email-verification-token.repository';
import { EMAIL_VERIFICATION_TOKEN_MODEL, EmailVerificationTokenSchema } from '../04-infrastructure/email/email-verification-token.schema';
import { NodemailerEmailSender } from '../04-infrastructure/email/nodemailer-email-sender';
import { RegisterUseCase } from '../02-application/register.use-case';
import { LoginUseCase } from '../02-application/login.use-case';
import { RefreshTokensUseCase } from '../02-application/refresh-tokens.use-case';
import { LogoutUseCase } from '../02-application/logout.use-case';
import { IssueReadonlyTokenUseCase } from '../02-application/issue-readonly-token.use-case';
import { VerifyEmailUseCase } from '../02-application/verify-email.use-case';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TierGuard } from './guards/tier.guard';
import {
  PASSWORD_HASHER,
  TOKEN_SERVICE,
  REFRESH_TOKEN_REPOSITORY,
  EMAIL_VERIFICATION_TOKEN_REPOSITORY,
  EMAIL_SENDER,
} from './auth.tokens';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';

@Module({
  imports: [
    UserModule,
    JwtModule.register({ secret: JWT_SECRET }),
    MongooseModule.forFeature([
      { name: REFRESH_TOKEN_MODEL, schema: RefreshTokenSchema },
      { name: EMAIL_VERIFICATION_TOKEN_MODEL, schema: EmailVerificationTokenSchema },
    ]),
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
      provide: EMAIL_VERIFICATION_TOKEN_REPOSITORY,
      useFactory: (model: Model<EmailVerificationTokenRecord>) =>
        new MongoEmailVerificationTokenRepository(model),
      inject: [getModelToken(EMAIL_VERIFICATION_TOKEN_MODEL)],
    },
    {
      provide: EMAIL_SENDER,
      useClass: NodemailerEmailSender,
    },
    {
      provide: RegisterUseCase,
      useFactory: (
        userRepo: UserRepositoryPort,
        verificationRepo: EmailVerificationTokenRepositoryPort,
        passwordHasher: PasswordHasherPort,
        emailSender: EmailSenderPort,
      ) => new RegisterUseCase(userRepo, verificationRepo, passwordHasher, emailSender),
      inject: [
        USER_REPOSITORY,
        EMAIL_VERIFICATION_TOKEN_REPOSITORY,
        PASSWORD_HASHER,
        EMAIL_SENDER,
      ],
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
      provide: VerifyEmailUseCase,
      useFactory: (
        userRepo: UserRepositoryPort,
        verificationRepo: EmailVerificationTokenRepositoryPort,
        refreshRepo: RefreshTokenRepositoryPort,
        tokenService: TokenServicePort,
      ) => new VerifyEmailUseCase(userRepo, verificationRepo, refreshRepo, tokenService),
      inject: [
        USER_REPOSITORY,
        EMAIL_VERIFICATION_TOKEN_REPOSITORY,
        REFRESH_TOKEN_REPOSITORY,
        TOKEN_SERVICE,
      ],
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
