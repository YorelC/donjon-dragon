import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '@modules/user/user.module';
import { AuthModule } from '@modules/auth/auth.module';
import { FriendshipModule } from '@modules/friendship/friendship.module';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/donjon-dragon';

@Module({
  imports: [
    MongooseModule.forRoot(MONGODB_URI),
    UserModule,
    AuthModule,
    FriendshipModule,
  ],
})
export class AppModule {}