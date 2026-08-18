import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';
import { z } from 'zod';

import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { jsonResult } from '../../tool-result.js';

const inputSchema = z.object({
  chat_id: z.union([z.number().int(), z.string().trim().min(1)]),
  max_id: z.number().int().min(0).optional().describe('Mark messages up to this ID. Omit to mark everything.'),
  clear_mentions: z.boolean().optional(),
});

@McpTool({
  name: 'mark_as_read',
  title: 'Mark chat as read',
  description: 'Marks messages in a chat as read.',
  requiresClient: true,
  inputSchema,
  annotations: { idempotentHint: true },
})
@Injectable()
export class MarkAsReadTool implements TelegramMcpToolHandler {
  public async execute(client: TelegramClient, input: unknown): Promise<CallToolResult> {
    const { chat_id, max_id, clear_mentions } = inputSchema.parse(input);

    await client.readHistory(chat_id, { maxId: max_id, clearMentions: clear_mentions });

    return jsonResult({ success: true });
  }
}
