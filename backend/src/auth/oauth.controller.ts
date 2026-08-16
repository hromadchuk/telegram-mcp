import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import type { ServerResponse } from 'node:http';

import {
  type CompleteAuthorizationRequest,
  OAuthService,
  type RegisterClientRequest,
  type TokenRequest,
} from './oauth.service.js';

@Controller()
export class OAuthController {
  public constructor(private readonly oauthService: OAuthService) {}

  @Get('.well-known/oauth-protected-resource/mcp')
  public protectedResourceMetadata() {
    return this.oauthService.getProtectedResourceMetadata();
  }

  @Get('.well-known/oauth-authorization-server')
  public authorizationServerMetadata() {
    return this.oauthService.getAuthorizationServerMetadata();
  }

  @Post('oauth/register')
  public register(@Body() body: RegisterClientRequest, @Res() res: ServerResponse): void {
    this.respond(res, () => this.oauthService.registerClient(body), 'invalid_client_metadata');
  }

  @Post('oauth/complete')
  public complete(@Body() body: CompleteAuthorizationRequest, @Res() res: ServerResponse): void {
    this.respond(res, () => this.oauthService.completeAuthorization(body), 'invalid_request');
  }

  @Post('oauth/token')
  public token(@Body() body: TokenRequest, @Res() res: ServerResponse): void {
    this.respond(res, () => this.oauthService.exchangeToken(body), 'invalid_grant');
  }

  private respond(res: ServerResponse, action: () => unknown, errorCode: string): void {
    try {
      const body = action();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify(body));
    } catch (error) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(
        JSON.stringify({
          error: errorCode,
          error_description: error instanceof Error ? error.message : 'OAuth request failed.',
        }),
      );
    }
  }
}
