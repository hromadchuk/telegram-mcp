import { Module } from '@nestjs/common';

import { TelegramClientService } from './telegram-client.service.js';

@Module({
  providers: [TelegramClientService],
  exports: [TelegramClientService],
})
export class TelegramModule {}
