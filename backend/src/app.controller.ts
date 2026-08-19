import { Controller, Get, Req, Res } from '@nestjs/common';
import type { IncomingMessage, ServerResponse } from 'node:http';

@Controller()
export class AppController {
  @Get('connect')
  public connect(@Req() req: IncomingMessage, @Res() res: ServerResponse): void {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173';
    const destination = new URL(req.url ?? '/connect', frontendUrl);

    res.statusCode = 302;
    res.setHeader('Location', destination.toString());
    res.end();
  }
}
