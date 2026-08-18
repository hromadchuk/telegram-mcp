import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';
import { z } from 'zod';

import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { jsonResult } from '../../tool-result.js';

const inputSchema = z.object({
  chat_id: z.union([z.number().int(), z.string().trim().min(1)]),
  message_ids: z.array(z.number().int().positive()).min(1).max(100),
  revoke: z.boolean().default(true).describe('Delete for all participants when Telegram permits it.'),
});

@McpTool({
  name: 'delete_messages',
  title: 'Delete messages',
  description: 'Deletes one or more messages from a chat.',
  requiresClient: true,
  inputSchema,
  annotations: { destructiveHint: true, idempotentHint: true },
})
@Injectable()
export class DeleteMessagesTool implements TelegramMcpToolHandler {
  public async execute(client: TelegramClient, input: unknown): Promise<CallToolResult> {
    const { chat_id, message_ids, revoke } = inputSchema.parse(input);

    await client.deleteMessagesById(chat_id, message_ids, { revoke });

    return jsonResult({ deleted: message_ids });
  }
}
