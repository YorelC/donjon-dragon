import { Module } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { User } from '@donjon-dragon/shared/user-schema';

import type { UserRepositoryPort } from '../domain/user.repository.port';
import { MongoUserRepository } from '../infrastructure/mongo-user.repository';
import { USER_MODEL, UserSchema } from '../infrastructure/user.schema';

export const USER_REPOSITORY = 'USER_REPOSITORY';

@Module({
  imports: [MongooseModule.forFeature([{ name: USER_MODEL, schema: UserSchema }])],
  providers: [
    {
      provide: USER_REPOSITORY,
      useFactory: (model: Model<User>) => new MongoUserRepository(model),
      inject: [getModelToken(USER_MODEL)],
    },
  ],
  exports: [USER_REPOSITORY],
})
export class UserModule {}
