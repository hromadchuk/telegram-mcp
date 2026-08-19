import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';
import { z } from 'zod';

import { serializeMessage } from '../../common/serializers/message.serializer.js';
import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { peerIdSchema, peerReferenceSchema, PeerReferenceService } from '../../peer-reference.service.js';
import { jsonResult } from '../../tool-result.js';

const inputSchema = z.object({
  query: z.string().default(''),
  chat_id: peerIdSchema.optional(),
  chat_ref: peerReferenceSchema.optional(),
  from_user: peerIdSchema.optional(),
  from_user_ref: peerReferenceSchema.optional(),
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
  public constructor(private readonly peerReferenceService: PeerReferenceService) {}

  public async execute(client: TelegramClient, input: unknown): Promise<CallToolResult> {
    const { query, chat_id, chat_ref, from_user, from_user_ref, limit, offset } = inputSchema.parse(input);
    const chatTarget =
      chat_id || chat_ref ? this.peerReferenceService.resolveOptionalTarget(chat_id, chat_ref) : undefined;
    const senderTarget =
      from_user || from_user_ref
        ? this.peerReferenceService.resolveOptionalTarget(from_user, from_user_ref)
        : undefined;
    const messages = await client.searchMessages({
      query,
      chatId: chatTarget,
      fromUser: senderTarget,
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
