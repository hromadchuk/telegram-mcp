import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';
import { z } from 'zod';

import { serializeMessage } from '../../common/serializers/message.serializer.js';
import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { jsonResult } from '../../tool-result.js';

const inputSchema = z.object({
  chat_id: z.union([z.number().int(), z.string().trim().min(1)]),
  message_ids: z.array(z.number().int().positive()).min(1).max(100),
});

@McpTool({
  name: 'get_messages',
  title: 'Get messages',
  description: 'Returns messages from a chat by their IDs.',
  requiresClient: true,
  inputSchema,
  annotations: { readOnlyHint: true },
})
@Injectable()
export class GetMessagesTool implements TelegramMcpToolHandler {
  public async execute(client: TelegramClient, input: unknown): Promise<CallToolResult> {
    const { chat_id, message_ids } = inputSchema.parse(input);
    const messages = await client.getMessages(chat_id, message_ids);

    return jsonResult({ messages: messages.map((message) => (message ? serializeMessage(message) : null)) });
  }
}
