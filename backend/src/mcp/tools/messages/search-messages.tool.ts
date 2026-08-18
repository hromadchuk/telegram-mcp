import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';
import { z } from 'zod';

import { serializeMessage } from '../../common/serializers/message.serializer.js';
import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { jsonResult } from '../../tool-result.js';

const inputSchema = z.object({
  query: z.string().default(''),
  chat_id: z.union([z.number().int(), z.string().trim().min(1)]).optional(),
  from_user: z.union([z.number().int(), z.string().trim().min(1)]).optional(),
  limit: z.number().int().min(1).max(100).default(100),
  offset: z.number().int().min(0).optional(),
});

@McpTool({
  name: 'search_messages',
  title: 'Search messages',
  description: 'Searches messages by text, optionally inside one chat or from one sender.',
  requiresClient: true,
  inputSchema,
  annotations: { readOnlyHint: true },
})
@Injectable()
export class SearchMessagesTool implements TelegramMcpToolHandler {
  public async execute(client: TelegramClient, input: unknown): Promise<CallToolResult> {
    const { query, chat_id, from_user, limit, offset } = inputSchema.parse(input);
    const messages = await client.searchMessages({
      query,
      chatId: chat_id,
      fromUser: from_user,
      limit,
      offset,
    });

    return jsonResult({
      total: messages.total,
      messages: messages.map(serializeMessage),
      nextOffset: messages.next ?? null,
    });
  }
}
