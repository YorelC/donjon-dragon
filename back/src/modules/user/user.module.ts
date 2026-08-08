import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { USER_REPOSITORY } from './application/ports/user-repository.port';
import { GetUserCredentialsUseCase } from './application/use-cases/get-user-credentials.use-case';
import { GetUserProfileUseCase } from './application/use-cases/get-user-profile.use-case';
import { MarkEmailVerifiedUseCase } from './application/use-cases/mark-email-verified.use-case';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { MongoUserRepository } from './infrastructure/persistence/mongo-user.repository';
import { USER_MODEL, UserSchema } from './infrastructure/persistence/user.schema';

/**
 * USER_REPOSITORY n'est volontairement PAS exporté : avec le repository en main,
 * un autre module pourrait écrire dans l'agrégat sans passer par ses invariants.
 * La surface publique du module, ce sont ses use-cases.
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: USER_MODEL, schema: UserSchema }]),
  ],
  providers: [
    { provide: USER_REPOSITORY, useClass: MongoUserRepository },
    RegisterUserUseCase,
    GetUserCredentialsUseCase,
    GetUserProfileUseCase,
    MarkEmailVerifiedUseCase,
  ],
  exports: [
    RegisterUserUseCase,
    GetUserCredentialsUseCase,
    GetUserProfileUseCase,
    MarkEmailVerifiedUseCase,
  ],
})
export class UserModule {}
