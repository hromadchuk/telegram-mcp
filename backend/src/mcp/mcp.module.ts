import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { TelegramModule } from '../telegram/telegram.module.js';
import { McpController } from './mcp.controller.js';
import { McpService } from './mcp.service.js';

@Module({
  imports: [AuthModule, TelegramModule],
  controllers: [McpController],
  providers: [McpService],
})
export class McpModule {}
