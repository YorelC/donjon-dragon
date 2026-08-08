import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { DomainExceptionFilter } from '@common/filters/domain-exception.filter';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { TierGuard } from '@common/guards/tier.guard';
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
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        config.getOrThrow<{ ttl: number; limit: number }>('security.throttle'),
      ],
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
    // Après le JwtAuthGuard, qui a posé request.user. Laisse passer toute route
    // sans @RequireTier.
    { provide: APP_GUARD, useClass: TierGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Traduit les erreurs de domaine en statuts HTTP : les controllers n'ont
    // plus un seul try/catch de mapping.
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
})
export class AppModule {}
