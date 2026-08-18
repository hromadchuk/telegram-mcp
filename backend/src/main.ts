import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module.js';
import { getNestLoggerConfig } from './common/utils.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: getNestLoggerConfig(),
    bodyParser: false,
  });

  app.useBodyParser('json', { limit: '4mb' });
  app.useBodyParser('urlencoded', { extended: false });
  await app.listen(3000, '127.0.0.1');
}

void bootstrap();
