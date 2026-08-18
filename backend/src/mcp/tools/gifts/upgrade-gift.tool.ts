import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';
import { z } from 'zod';

import { getGiftReference, giftReferenceSchema } from '../../common/gifts/gift-reference.js';
import { serializeMessage } from '../../common/serializers/message.serializer.js';
import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { jsonResult } from '../../tool-result.js';

const inputSchema = z.object({
  gift: giftReferenceSchema,
  keep_original_details: z.boolean().default(false),
});

@McpTool({
  name: 'upgrade_gift',
  title: 'Upgrade gift',
  description: 'Upgrades an eligible Telegram gift to a collectible gift.',
  requiresClient: true,
  inputSchema,
  annotations: { destructiveHint: true },
})
@Injectable()
export class UpgradeGiftTool implements TelegramMcpToolHandler {
  public async execute(client: TelegramClient, input: unknown): Promise<CallToolResult> {
    const { gift, keep_original_details } = inputSchema.parse(input);
    const message = await client.upgradeStarGift({
      gift: getGiftReference(gift),
      keepOriginalDetails: keep_original_details,
    });

    return jsonResult({ message: message ? serializeMessage(message) : null });
  }
}
