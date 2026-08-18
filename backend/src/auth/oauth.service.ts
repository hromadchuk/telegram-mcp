import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

import {
  type AccessToken,
  type AuthorizationCodeToken,
  type OAuthClientToken,
  type RefreshToken,
  type TelegramCredentials,
  TokenService,
} from './token.service.js';

const AUTHORIZATION_CODE_LIFETIME = 120;
const ACCESS_TOKEN_LIFETIME = 60 * 60;
const REFRESH_TOKEN_LIFETIME = 60 * 60 * 24 * 90;
const CLIENT_ID_LIFETIME = 60 * 60 * 24 * 365;
const DEFAULT_SCOPE = 'telegram';

export interface CompleteAuthorizationRequest extends TelegramCredentials {
  clientId: string;
  redirectUri: string;
  responseType: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  resource: string;
  scope?: string;
  state?: string;
}

export interface RegisterClientRequest {
  redirect_uris?: unknown;
  client_name?: unknown;
  token_endpoint_auth_method?: unknown;
}

export interface TokenRequest {
  grant_type?: unknown;
  code?: unknown;
  code_verifier?: unknown;
  redirect_uri?: unknown;
  client_id?: unknown;
  resource?: unknown;
  refresh_token?: unknown;
}

@Injectable()
export class OAuthService {
  private readonly origin: string;
  private readonly resource: string;

  public constructor(
    private readonly tokenService: TokenService,
    configService: ConfigService,
  ) {
    const configuredResource = configService.getOrThrow<string>('MCP_URL');
    const resource = new URL(configuredResource);

    if (
      (resource.protocol !== 'http:' && resource.protocol !== 'https:') ||
      resource.pathname !== '/mcp' ||
      resource.search ||
      resource.hash
    ) {
      throw new Error('MCP_URL must point to the /mcp endpoint without query parameters or a hash.');
    }

    this.origin = resource.origin;
    this.resource = resource.toString();
  }

  public getOrigin(): string {
    return this.origin;
  }

  public getResource(): string {
    return this.resource;
  }

  public getProtectedResourceMetadata() {
    return {
      resource: this.resource,
      authorization_servers: [this.origin],
      bearer_methods_supported: ['header'],
      scopes_supported: [DEFAULT_SCOPE],
    };
  }

  public getAuthorizationServerMetadata() {
    return {
      issuer: this.origin,
      authorization_endpoint: `${this.origin}/connect`,
      token_endpoint: `${this.origin}/oauth/token`,
      registration_endpoint: `${this.origin}/oauth/register`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none'],
      scopes_supported: [DEFAULT_SCOPE],
      authorization_response_iss_parameter_supported: true,
    };
  }

  public registerClient(body: RegisterClientRequest) {
    if (!Array.isArray(body.redirect_uris) || body.redirect_uris.length === 0) {
      throw new Error('redirect_uris must contain at least one URI.');
    }

    const redirectUris = body.redirect_uris.map((value) => {
      if (typeof value !== 'string') {
        throw new Error('Every redirect URI must be a string.');
      }

      this.validateRedirectUri(value);
      return value;
    });

    if (body.token_endpoint_auth_method && body.token_endpoint_auth_method !== 'none') {
      throw new Error('Only public OAuth clients are supported.');
    }

    const clientName = typeof body.client_name === 'string' ? body.client_name.slice(0, 100) : undefined;
    const clientId = this.tokenService.seal<OAuthClientToken>(
      {
        kind: 'oauth_client',
        redirectUris,
        clientName,
      },
      CLIENT_ID_LIFETIME,
    );

    return {
      client_id: clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      redirect_uris: redirectUris,
      client_name: clientName,
      application_type: 'native',
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
    };
  }

  public completeAuthorization(body: CompleteAuthorizationRequest): { redirectTo: string } {
    const apiId = Number(body.apiId);
    if (!Number.isInteger(apiId) || apiId <= 0 || !body.apiHash?.trim() || !body.session?.trim()) {
      throw new Error('Telegram credentials are invalid.');
    }

    if (body.responseType !== 'code') {
      throw new Error('Only the authorization code flow is supported.');
    }

    if (body.codeChallengeMethod !== 'S256' || !/^[A-Za-z0-9_-]{43,128}$/.test(body.codeChallenge)) {
      throw new Error('A valid S256 PKCE code challenge is required.');
    }

    const client = this.tokenService.open(body.clientId, 'oauth_client');
    if (!client.redirectUris.includes(body.redirectUri)) {
      throw new Error('The redirect URI is not registered for this client.');
    }

    if (body.resource !== this.resource) {
      throw new Error('The requested MCP resource is invalid.');
    }

    const scope = this.normalizeScope(body.scope);
    const code = this.tokenService.seal<AuthorizationCodeToken>(
      {
        kind: 'authorization_code',
        apiId,
        apiHash: body.apiHash.trim(),
        session: body.session.trim(),
        clientId: body.clientId,
        redirectUri: body.redirectUri,
        codeChallenge: body.codeChallenge,
        resource: body.resource,
        scope,
      },
      AUTHORIZATION_CODE_LIFETIME,
    );

    const callback = new URL(body.redirectUri);
    callback.searchParams.set('code', code);
    callback.searchParams.set('iss', this.origin);
    if (body.state) {
      callback.searchParams.set('state', body.state);
    }

    return { redirectTo: callback.toString() };
  }

  public exchangeToken(body: TokenRequest) {
    if (body.grant_type === 'authorization_code') {
      return this.exchangeAuthorizationCode(body);
    }

    if (body.grant_type === 'refresh_token') {
      return this.exchangeRefreshToken(body);
    }

    throw new Error('Unsupported grant type.');
  }

  public readAccessToken(req: IncomingMessage): AccessToken & { iat: number; exp: number } {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      throw new Error('Bearer token is missing.');
    }

    const token = this.tokenService.open(authorization.slice('Bearer '.length), 'access_token');
    if (token.resource !== this.resource) {
      throw new Error('The token audience is invalid.');
    }

    return token;
  }

  private exchangeAuthorizationCode(body: TokenRequest) {
    const code = this.requireString(body.code, 'code');
    const verifier = this.requireString(body.code_verifier, 'code_verifier');
    const redirectUri = this.requireString(body.redirect_uri, 'redirect_uri');
    const clientId = this.requireString(body.client_id, 'client_id');
    const resource = this.requireString(body.resource, 'resource');
    const authorizationCode = this.tokenService.open(code, 'authorization_code');

    if (
      authorizationCode.clientId !== clientId ||
      authorizationCode.redirectUri !== redirectUri ||
      authorizationCode.resource !== resource ||
      resource !== this.resource
    ) {
      throw new Error('Authorization code parameters do not match.');
    }

    if (!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)) {
      throw new Error('PKCE code verifier is invalid.');
    }

    const actualChallenge = createHash('sha256').update(verifier).digest('base64url');
    if (!this.safeEqual(actualChallenge, authorizationCode.codeChallenge)) {
      throw new Error('PKCE verification failed.');
    }

    return this.issueTokens(authorizationCode);
  }

  private exchangeRefreshToken(body: TokenRequest) {
    const encodedRefreshToken = this.requireString(body.refresh_token, 'refresh_token');
    const clientId = this.requireString(body.client_id, 'client_id');
    const resource = this.requireString(body.resource, 'resource');
    const refreshToken = this.tokenService.open(encodedRefreshToken, 'refresh_token');

    if (refreshToken.clientId !== clientId || refreshToken.resource !== resource || resource !== this.resource) {
      throw new Error('Refresh token parameters do not match.');
    }

    return this.issueTokens(refreshToken);
  }

  private issueTokens(source: AuthorizationCodeToken | RefreshToken) {
    const common = {
      apiId: source.apiId,
      apiHash: source.apiHash,
      session: source.session,
      clientId: source.clientId,
      resource: source.resource,
      scope: source.scope,
    };
    const accessToken = this.tokenService.seal<AccessToken>({ kind: 'access_token', ...common }, ACCESS_TOKEN_LIFETIME);
    const refreshToken = this.tokenService.seal<RefreshToken>(
      { kind: 'refresh_token', ...common },
      REFRESH_TOKEN_LIFETIME,
    );

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: ACCESS_TOKEN_LIFETIME,
      refresh_token: refreshToken,
      scope: source.scope,
    };
  }

  private normalizeScope(scope: string | undefined): string {
    const requested = scope?.trim() || DEFAULT_SCOPE;
    const scopes = requested.split(/\s+/);
    if (scopes.some((value) => value !== DEFAULT_SCOPE)) {
      throw new Error('An unsupported OAuth scope was requested.');
    }

    return DEFAULT_SCOPE;
  }

  private validateRedirectUri(value: string): void {
    const uri = new URL(value);
    const isHttps = uri.protocol === 'https:';
    const isLoopback =
      uri.protocol === 'http:' &&
      (uri.hostname === '127.0.0.1' || uri.hostname === 'localhost' || uri.hostname === '[::1]');

    if ((!isHttps && !isLoopback) || uri.hash) {
      throw new Error('Redirect URIs must use HTTPS or an HTTP loopback address.');
    }
  }

  private requireString(value: unknown, name: string): string {
    if (typeof value !== 'string' || !value) {
      throw new Error(`${name} is required.`);
    }

    return value;
  }

  private safeEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
  }
}
