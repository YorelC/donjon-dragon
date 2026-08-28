import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { CsrfTokenService } from '@common/security/csrf-token.service';
import { ClockModule } from '@kernel/infrastructure/clock.module';
import { SessionRevocationModule } from '@kernel/infrastructure/session-revocation.module';
import { UserModule } from '@modules/user/user.module';
import { EMAIL_SENDER } from './application/ports/email-sender.port';
import { EMAIL_VERIFICATION_TOKEN_REPOSITORY } from './application/ports/email-verification-token.repository.port';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { REFRESH_TOKEN_REPOSITORY } from './application/ports/refresh-token.repository.port';
import { TOKEN_SERVICE } from './application/ports/token-service.port';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import { RefreshTokensUseCase } from './application/use-cases/refresh-tokens.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { VerifyAccessTokenUseCase } from './application/use-cases/verify-access-token.use-case';
import { ACCESS_TOKEN_VERIFIER } from './application/ports/access-token-verifier.port';
import { BcryptPasswordHasher } from './infrastructure/crypto/bcrypt-password-hasher';
import { NodemailerEmailSender } from './infrastructure/mail/nodemailer-email-sender';
import { CapturedEmailSender } from './infrastructure/mail/captured-email-sender';
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
import { JwtTokenService } from './infrastructure/token/jwt-token.service';
import { JwtAccessTokenVerifier } from './infrastructure/token/jwt-access-token-verifier';
import { AuthController } from './presentation/auth.controller';
import { SessionCookies } from './presentation/session-cookies';
import { JwtStrategy } from './presentation/strategies/jwt.strategy';

@Module({
  imports: [
    UserModule,
    ClockModule,
    SessionRevocationModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('jwt.secret'),
      }),
    }),
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
    // La stratégie s'enregistre auprès de Passport sous le nom 'jwt' : c'est ce
    // qui permet au JwtAuthGuard global de fonctionner sans que les autres
    // modules aient à importer quoi que ce soit d'auth.
    JwtStrategy,
    SessionCookies,
    CsrfTokenService,
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: ACCESS_TOKEN_VERIFIER, useClass: JwtAccessTokenVerifier },
    // useFactory assumé : l'adapter reçoit une valeur primitive, pas un service.
    {
      provide: PASSWORD_HASHER,
      useFactory: (config: ConfigService) =>
        new BcryptPasswordHasher(config.getOrThrow<number>('security.bcryptRounds')),
      inject: [ConfigService],
    },
    NodemailerEmailSender,
    CapturedEmailSender,
    {
      provide: EMAIL_SENDER,
      inject: [ConfigService, NodemailerEmailSender, CapturedEmailSender],
      useFactory: selectEmailSender,
    },
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
    VerifyAccessTokenUseCase,
  ],
  exports: [VerifyAccessTokenUseCase],
})
export class AuthModule {}

function selectEmailSender(
  config: ConfigService,
  smtp: NodemailerEmailSender,
  captured: CapturedEmailSender,
) {
  return config.get<string>('mail.capturePath') ? captured : smtp;
}
