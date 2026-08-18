import { Controller, Post, Req, Res } from '@nestjs/common';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { OAuthService } from '../auth/oauth.service.js';
import type { AccessToken } from '../auth/token.service.js';
import { McpService } from './mcp.service.js';

type McpRequest = IncomingMessage & {
  body?: unknown;
};

@Controller('mcp')
export class McpController {
  public constructor(
    private readonly mcpService: McpService,
    private readonly oauthService: OAuthService,
  ) {}

  @Post()
  public async handle(@Req() req: McpRequest, @Res() res: ServerResponse): Promise<void> {
    let accessToken: AccessToken;

    try {
      accessToken = this.oauthService.readAccessToken(req);
    } catch {
      const metadataUrl = `${this.oauthService.getOrigin()}/.well-known/oauth-protected-resource/mcp`;

      res.statusCode = 401;
      res.setHeader('WWW-Authenticate', `Bearer resource_metadata="${metadataUrl}", scope="telegram"`);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'unauthorized' }));

      return;
    }

    await this.mcpService.handle(req, res, accessToken);
  }
}
