import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { McpModule } from './mcp/mcp.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    AuthModule,
    McpModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
