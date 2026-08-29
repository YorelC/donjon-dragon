import 'dotenv/config';

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { SecureSocketIoAdapter } from '@common/security/secure-socket-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  applyHttpMiddleware(app);
  applyOriginPolicy(app, config);

  // Les controllers déclarent 'auth' / 'friends' : le préfixe vit ici, une fois.
  app.setGlobalPrefix('api');

  // Les écouteurs de SIGTERM et SIGINT sont désactivés par défaut. Sans cet
  // appel, un conteneur arrêté ne déclenche aucun hook : le relais temps réel
  // garde son timer et laisse un message réclamé en `processing` jusqu'à
  // expiration de son bail. https://docs.nestjs.com/fundamentals/lifecycle-events
  app.enableShutdownHooks();

  const port = config.getOrThrow<number>('app.port');
  await app.listen(port);
  console.log(`Backend listening on port ${port}`);
}

function applyHttpMiddleware(app: INestApplication): void {
  app.use(helmet());
  // Les cookies de session sont lus par la strategie JWT et par le garde CSRF :
  // sans ce middleware, request.cookies n'existe pas.
  app.use(cookieParser());
}

/**
 * Liste explicite et `credentials: true` : le navigateur refuse
 * `Access-Control-Allow-Origin: *` des que les credentials sont actives, donc
 * un joker rendrait les cookies inexploitables. Le handshake Socket.IO controle
 * la meme liste.
 */
function applyOriginPolicy(app: INestApplication, config: ConfigService): void {
  const corsOrigins = config.getOrThrow<string[]>('security.corsOrigins');
  app.enableCors({ origin: corsOrigins, credentials: true });
  app.useWebSocketAdapter(new SecureSocketIoAdapter(app, corsOrigins));
}

bootstrap();
