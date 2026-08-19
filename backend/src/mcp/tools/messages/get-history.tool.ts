import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';
import { z } from 'zod';

import { serializeMessage } from '../../common/serializers/message.serializer.js';
import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { PeerReferenceService, withRequiredChatTarget } from '../../peer-reference.service.js';
import { jsonResult } from '../../tool-result.js';

const inputSchema = withRequiredChatTarget({
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
  public constructor(private readonly peerReferenceService: PeerReferenceService) {}

  public async execute(client: TelegramClient, input: unknown): Promise<CallToolResult> {
    const params = inputSchema.parse(input);
    const target = this.peerReferenceService.resolveTarget(params);
    const { limit, offset } = params;
    const messages = await client.getHistory(target, { limit, offset });

    return jsonResult({
      total: messages.total,
      messages: messages.map(serializeMessage),
      nextOffset: messages.next ?? null,
    });
  }
}
