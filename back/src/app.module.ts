import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CharacterModule } from './character/interface/character.module';
import { CombatModule } from './combat/interface/combat.module';
import { UserModule } from './user/interface/user.module';
import { AuthModule } from './auth/interface/auth.module';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/donjon-dragon';

@Module({
  imports: [
    MongooseModule.forRoot(MONGODB_URI),
    CharacterModule,
    CombatModule,
    UserModule,
    AuthModule,
  ],
})
export class AppModule {}