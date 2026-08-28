import 'dotenv/config';

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { SecureSocketIoAdapter } from '@common/security/secure-socket-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet());
  // Les cookies de session sont lus par la strategie JWT et par le garde CSRF :
  // sans ce middleware, request.cookies n'existe pas.
  app.use(cookieParser());

  // Liste explicite et `credentials: true` : le navigateur refuse
  // `Access-Control-Allow-Origin: *` des que les credentials sont actives, donc
  // un joker rendrait les cookies inexploitables.
  app.enableCors({
    origin: config.getOrThrow<string[]>('security.corsOrigins'),
    credentials: true,
  });
  app.useWebSocketAdapter(
    new SecureSocketIoAdapter(
      app,
      config.getOrThrow<string[]>('security.corsOrigins'),
    ),
  );

  // Les controllers déclarent 'auth' / 'friends' : le préfixe vit ici, une fois.
  app.setGlobalPrefix('api');

  const port = config.getOrThrow<number>('app.port');
  await app.listen(port);
  console.log(`Backend listening on port ${port}`);
}
bootstrap();
