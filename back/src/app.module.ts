import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CharacterModule } from './character/01-interface/character.module';
import { CombatModule } from './combat/01-interface/combat.module';
import { UserModule } from './user/01-interface/user.module';
import { AuthModule } from './auth/01-interface/auth.module';
import { FriendshipModule } from './friendship/01-interface/friendship.module';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/donjon-dragon';

@Module({
  imports: [
    MongooseModule.forRoot(MONGODB_URI),
    CharacterModule,
    CombatModule,
    UserModule,
    AuthModule,
    FriendshipModule,
  ],
})
export class AppModule {}