import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { USER_REPOSITORY } from './application/ports/user-repository.port';
import { MongoUserRepository } from './infrastructure/persistence/mongo-user.repository';
import { USER_MODEL, UserSchema } from './infrastructure/persistence/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: USER_MODEL, schema: UserSchema }]),
  ],
  providers: [{ provide: USER_REPOSITORY, useClass: MongoUserRepository }],
  exports: [USER_REPOSITORY],
})
export class UserModule {}
