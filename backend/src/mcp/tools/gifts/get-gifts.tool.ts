import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';
import { z } from 'zod';

import { serializeSavedStarGift } from '../../common/serializers/gift.serializer.js';
import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { jsonResult } from '../../tool-result.js';

const inputSchema = z.object({
  owner: z.union([z.number().int(), z.string().trim().min(1)]).default('self'),
  exclude_hidden: z.boolean().optional(),
  exclude_public: z.boolean().optional(),
  exclude_unlimited: z.boolean().optional(),
  exclude_unique: z.boolean().optional(),
  exclude_unupgradable: z.boolean().optional(),
  exclude_upgradable: z.boolean().optional(),
  peer_color_available: z.boolean().optional(),
  collection_id: z.number().int().positive().optional(),
  sort_by_value: z.boolean().optional(),
  offset: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(100),
});

@McpTool({
  name: 'get_gifts',
  title: 'Get gifts',
  description: 'Returns paginated Telegram gifts owned, received, or hosted by a user or channel.',
  requiresClient: true,
  inputSchema,
  annotations: { readOnlyHint: true },
})
@Injectable()
export class GetGiftsTool implements TelegramMcpToolHandler {
  public async execute(client: TelegramClient, input: unknown): Promise<CallToolResult> {
    const params = inputSchema.parse(input);
    const gifts = await client.getSavedStarGifts({
      owner: params.owner,
      excludeHidden: params.exclude_hidden,
      excludePublic: params.exclude_public,
      excludeUnlimited: params.exclude_unlimited,
      excludeUnique: params.exclude_unique,
      excludeUnupgradable: params.exclude_unupgradable,
      excludeUpgradable: params.exclude_upgradable,
      peerColorAvailable: params.peer_color_available,
      collectionId: params.collection_id,
      sortByValue: params.sort_by_value,
      offset: params.offset,
      limit: params.limit,
    });

    return jsonResult({
      total: gifts.total,
      gifts: gifts.map(serializeSavedStarGift),
      nextOffset: gifts.next ?? null,
    });
  }
}
