import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { getNestLoggerConfig } from './common/utils.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: getNestLoggerConfig(),
  });
  await app.listen(3000, '127.0.0.1');
}

void bootstrap();
