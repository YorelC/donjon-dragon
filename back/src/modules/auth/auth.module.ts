import { Module } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { RefreshTokenRecord, EmailVerificationTokenRecord } from '@donjon-dragon/shared/auth-schema';

import { UserModule } from '@modules/user/user.module';
import { USER_REPOSITORY } from '@modules/user/user.module';
import type { UserRepositoryPort } from '@modules/user/application/ports/user-repository.port';
import type { RefreshTokenRepositoryPort } from './application/ports/refresh-token.repository.port';
import type { EmailVerificationTokenRepositoryPort } from './application/ports/email-verification-token.repository.port';
import type { PasswordHasherPort } from './application/ports/password-hasher.port';
import type { TokenServicePort } from './application/ports/token-service.port';
import type { EmailSenderPort } from './application/ports/email-sender.port';
import { BcryptPasswordHasher } from './infrastructure/crypto/bcrypt-password-hasher';
import { MongoRefreshTokenRepository } from './infrastructure/persistence/mongo-refresh-token.repository';
import { REFRESH_TOKEN_MODEL, RefreshTokenSchema } from './infrastructure/persistence/refresh-token.schema';
import { MongoEmailVerificationTokenRepository } from './infrastructure/persistence/mongo-email-verification-token.repository';
import { EMAIL_VERIFICATION_TOKEN_MODEL, EmailVerificationTokenSchema } from './infrastructure/persistence/email-verification-token.schema';
import { NodemailerEmailSender } from './infrastructure/mail/nodemailer-email-sender';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RefreshTokensUseCase } from './application/use-cases/refresh-tokens.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { IssueReadonlyTokenUseCase } from './application/use-cases/issue-readonly-token.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import { AuthController } from './presentation/auth.controller';
import { AuthGuardsModule } from './auth-guards.module';
import {
  PASSWORD_HASHER,
  TOKEN_SERVICE,
  REFRESH_TOKEN_REPOSITORY,
  EMAIL_VERIFICATION_TOKEN_REPOSITORY,
  EMAIL_SENDER,
} from './auth.tokens';

@Module({
  imports: [
    UserModule,
    AuthGuardsModule,
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
  ],
})
export class AuthModule {}
