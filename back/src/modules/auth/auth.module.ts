import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UserModule } from '@modules/user/user.module';
import { EMAIL_SENDER } from './application/ports/email-sender.port';
import { EMAIL_VERIFICATION_TOKEN_REPOSITORY } from './application/ports/email-verification-token.repository.port';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { REFRESH_TOKEN_REPOSITORY } from './application/ports/refresh-token.repository.port';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import { RefreshTokensUseCase } from './application/use-cases/refresh-tokens.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { IssueReadonlyTokenUseCase } from './application/use-cases/issue-readonly-token.use-case';
import { BcryptPasswordHasher } from './infrastructure/crypto/bcrypt-password-hasher';
import { NodemailerEmailSender } from './infrastructure/mail/nodemailer-email-sender';
import {
  EMAIL_VERIFICATION_TOKEN_MODEL,
  EmailVerificationTokenSchema,
} from './infrastructure/persistence/email-verification-token.schema';
import { MongoEmailVerificationTokenRepository } from './infrastructure/persistence/mongo-email-verification-token.repository';
import { MongoRefreshTokenRepository } from './infrastructure/persistence/mongo-refresh-token.repository';
import {
  REFRESH_TOKEN_MODEL,
  RefreshTokenSchema,
} from './infrastructure/persistence/refresh-token.schema';
import { AuthController } from './presentation/auth.controller';
import { AuthGuardsModule } from './auth-guards.module';

@Module({
  imports: [
    UserModule,
    AuthGuardsModule,
    MongooseModule.forFeature([
      { name: REFRESH_TOKEN_MODEL, schema: RefreshTokenSchema },
      {
        name: EMAIL_VERIFICATION_TOKEN_MODEL,
        schema: EmailVerificationTokenSchema,
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: EMAIL_SENDER, useClass: NodemailerEmailSender },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: MongoRefreshTokenRepository },
    {
      provide: EMAIL_VERIFICATION_TOKEN_REPOSITORY,
      useClass: MongoEmailVerificationTokenRepository,
    },
    RegisterUseCase,
    LoginUseCase,
    VerifyEmailUseCase,
    RefreshTokensUseCase,
    LogoutUseCase,
    IssueReadonlyTokenUseCase,
  ],
})
export class AuthModule {}
