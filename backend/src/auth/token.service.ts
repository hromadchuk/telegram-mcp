import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const TOKEN_VERSION = 'v1';
const TOKEN_AAD = Buffer.from('telegram-mcp:v1');

export interface TelegramCredentials {
  apiId: number;
  apiHash: string;
  session: string;
}

export interface OAuthClientToken {
  kind: 'oauth_client';
  redirectUris: string[];
  clientName?: string;
}

export interface AuthorizationCodeToken extends TelegramCredentials {
  kind: 'authorization_code';
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  resource: string;
  scope: string;
}

export interface AccessToken extends TelegramCredentials {
  kind: 'access_token';
  clientId: string;
  resource: string;
  scope: string;
}

export interface RefreshToken extends TelegramCredentials {
  kind: 'refresh_token';
  clientId: string;
  resource: string;
  scope: string;
}

type TokenPayload = OAuthClientToken | AuthorizationCodeToken | AccessToken | RefreshToken;
type StoredToken<T extends TokenPayload> = T & {
  iat: number;
  exp: number;
};

@Injectable()
export class TokenService {
  public constructor(private readonly configService: ConfigService) {}

  public seal<T extends TokenPayload>(payload: T, lifetimeSeconds: number): string {
    const key = this.getKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const now = Math.floor(Date.now() / 1000);
    const plaintext = Buffer.from(
      JSON.stringify({
        ...payload,
        iat: now,
        exp: now + lifetimeSeconds,
      } satisfies StoredToken<T>),
    );

    cipher.setAAD(TOKEN_AAD);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();

    return [TOKEN_VERSION, iv.toString('base64url'), ciphertext.toString('base64url'), tag.toString('base64url')].join(
      '.',
    );
  }

  public open<T extends TokenPayload['kind']>(
    token: string,
    expectedKind: T,
  ): StoredToken<Extract<TokenPayload, { kind: T }>> {
    const [version, encodedIv, encodedCiphertext, encodedTag, extra] = token.split('.');

    if (version !== TOKEN_VERSION || !encodedIv || !encodedCiphertext || !encodedTag || extra) {
      throw new Error('Malformed token.');
    }

    try {
      const decipher = createDecipheriv('aes-256-gcm', this.getKey(), Buffer.from(encodedIv, 'base64url'));

      decipher.setAAD(TOKEN_AAD);
      decipher.setAuthTag(Buffer.from(encodedTag, 'base64url'));
      const plaintext = Buffer.concat([
        decipher.update(Buffer.from(encodedCiphertext, 'base64url')),
        decipher.final(),
      ]).toString('utf8');
      const payload = JSON.parse(plaintext) as StoredToken<Extract<TokenPayload, { kind: T }>>;

      if (payload.kind !== expectedKind || !Number.isInteger(payload.exp) || payload.exp <= Date.now() / 1000) {
        throw new Error('Token is invalid or expired.');
      }

      return payload;
    } catch {
      throw new Error('Token is invalid or expired.');
    }
  }

  private getKey(): Buffer {
    const encodedKey = this.configService.getOrThrow<string>('TOKEN_SECRET');
    const key = Buffer.from(encodedKey, 'base64url');

    if (key.length !== 32) {
      throw new Error('TOKEN_SECRET must be a base64url-encoded 32-byte key.');
    }

    return key;
  }
}
