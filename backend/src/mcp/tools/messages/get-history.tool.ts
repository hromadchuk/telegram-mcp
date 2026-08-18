import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';
import { z } from 'zod';

import { serializeMessage } from '../../common/serializers/message.serializer.js';
import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { jsonResult } from '../../tool-result.js';

const inputSchema = z.object({
  chat_id: z.union([z.number().int(), z.string().trim().min(1)]),
  limit: z.number().int().min(1).max(100).default(100),
  offset: z.object({ id: z.number().int().min(0), date: z.number().int().min(0) }).optional(),
});

@McpTool({
  name: 'get_history',
  title: 'Get chat history',
  description: 'Returns messages from a chat, newest first.',
  requiresClient: true,
  inputSchema,
  annotations: { readOnlyHint: true },
})
@Injectable()
export class GetHistoryTool implements TelegramMcpToolHandler {
  public async execute(client: TelegramClient, input: unknown): Promise<CallToolResult> {
    const { chat_id, limit, offset } = inputSchema.parse(input);
    const messages = await client.getHistory(chat_id, { limit, offset });

    return jsonResult({
      total: messages.total,
      messages: messages.map(serializeMessage),
      nextOffset: messages.next ?? null,
    });
  }
}
