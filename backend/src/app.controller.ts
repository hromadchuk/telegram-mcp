import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@repo/shared';

@Controller()
export class AppController {
  @Get('health')
  public health(): HealthResponse {
    return {
      name: 'telegram-mcp',
      status: 'ok',
    };
  }
}
