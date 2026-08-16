import { Injectable } from '@nestjs/common';
import { MemoryStorage, TelegramClient } from '@mtcute/node';

import type { TelegramCredentials } from '../auth/token.service.js';

export interface TelegramProfile {
  id: number;
  firstName: string;
  lastName: string | null;
  displayName: string;
  username: string | null;
  isPremium: boolean;
}

@Injectable()
export class TelegramClientService {
  public async getMe(credentials: TelegramCredentials): Promise<TelegramProfile> {
    const client = new TelegramClient({
      apiId: credentials.apiId,
      apiHash: credentials.apiHash,
      storage: new MemoryStorage(),
      disableUpdates: true,
    });

    try {
      await client.importSession(credentials.session);
      const user = await client.getMe();

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        username: user.username,
        isPremium: user.isPremium,
      };
    } finally {
      await client.destroy();
    }
  }
}
