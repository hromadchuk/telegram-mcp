import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';
import { z } from 'zod';

import { getGiftReference, giftReferenceSchema } from '../../common/gifts/gift-reference.js';
import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { jsonResult } from '../../tool-result.js';

const inputSchema = z.object({
  gift: giftReferenceSchema,
  visible: z.boolean(),
});

@McpTool({
  name: 'set_gift_visibility',
  title: 'Set gift visibility',
  description: 'Shows or hides an owned Telegram gift on its owner profile.',
  requiresClient: true,
  inputSchema,
  annotations: { idempotentHint: true },
})
@Injectable()
export class SetGiftVisibilityTool implements TelegramMcpToolHandler {
  public async execute(client: TelegramClient, input: unknown): Promise<CallToolResult> {
    const { gift, visible } = inputSchema.parse(input);
    const success = await client.acceptStarGift({
      gift: getGiftReference(gift),
      action: visible ? 'save' : 'hide',
    });

    return jsonResult({ success, visible });
  }
}
