import 'dotenv/config';

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({ origin: config.getOrThrow<string>('security.corsOrigin') });

  const port = config.getOrThrow<number>('app.port');
  await app.listen(port);
  console.log(`Backend listening on port ${port}`);
}
bootstrap();
