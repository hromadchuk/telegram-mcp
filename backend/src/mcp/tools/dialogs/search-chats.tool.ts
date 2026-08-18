import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';
import { z } from 'zod';

import { serializePeer } from '../../common/serializers/peer.serializer.js';
import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { jsonResult } from '../../tool-result.js';

const inputSchema = z.object({
  query: z.string().trim().min(1),
  limit: z.number().int().min(1).max(100).default(50),
});

@McpTool({
  name: 'search_chats',
  title: 'Search chats',
  description: 'Searches messages and peers globally and returns the matching chats.',
  requiresClient: true,
  inputSchema,
  annotations: { readOnlyHint: true },
})
@Injectable()
export class SearchChatsTool implements TelegramMcpToolHandler {
  public async execute(client: TelegramClient, input: unknown): Promise<CallToolResult> {
    const { query, limit } = inputSchema.parse(input);
    const messages = await client.searchGlobal({ query, limit });
    const chats = [...new Map(messages.map(({ chat }) => [`${chat.type}:${chat.id}`, chat])).values()];

    return jsonResult({ chats: chats.map(serializePeer) });
  }
}
