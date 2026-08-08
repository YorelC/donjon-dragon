import { Module } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { User } from '@donjon-dragon/shared/user-schema';

import { MongoUserRepository } from './infrastructure/persistence/mongo-user.repository';
import { USER_MODEL, UserSchema } from './infrastructure/persistence/user.schema';

export const USER_REPOSITORY = 'USER_REPOSITORY';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: USER_MODEL, schema: UserSchema }]),
  ],
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
