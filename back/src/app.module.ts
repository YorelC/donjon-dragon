import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { configNamespaces } from '@config/configuration';
import { validateEnv } from '@config/env.validation';
import { DatabaseModule } from '@kernel/infrastructure/database.module';
import { UserModule } from '@modules/user/user.module';
import { AuthModule } from '@modules/auth/auth.module';
import { FriendshipModule } from '@modules/friendship/friendship.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: configNamespaces,
      validate: validateEnv,
    }),
    DatabaseModule,
    UserModule,
    AuthModule,
    FriendshipModule,
  ],
  providers: [
    // Tout est protégé par défaut. Une route publique doit le déclarer avec
    // @Public() — l'oubli ferme la route, il ne l'ouvre pas.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
