import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { getNestLoggerConfig } from './common/utils.js';

type RequestHandler = (req: unknown, res: unknown) => unknown;

let cachedHandler: RequestHandler | null = null;
let bootstrapPromise: Promise<RequestHandler> | null = null;

async function bootstrap(): Promise<RequestHandler> {
  const app = await NestFactory.create(AppModule, {
    logger: getNestLoggerConfig(),
  });
  await app.init();
  return app.getHttpAdapter().getInstance() as RequestHandler;
}

export async function getVercelHandler(): Promise<RequestHandler> {
  if (cachedHandler) {
    return cachedHandler;
  }

  if (!bootstrapPromise) {
    bootstrapPromise = bootstrap().then((handler) => {
      cachedHandler = handler;
      return handler;
    });
  }

  return bootstrapPromise;
}
