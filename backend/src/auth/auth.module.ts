import { Module } from '@nestjs/common';

import { OAuthController } from './oauth.controller.js';
import { OAuthService } from './oauth.service.js';
import { TokenService } from './token.service.js';

@Module({
  controllers: [OAuthController],
  providers: [OAuthService, TokenService],
  exports: [OAuthService],
})
export class AuthModule {}
