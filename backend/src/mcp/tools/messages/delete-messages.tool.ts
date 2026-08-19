import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';
import { z } from 'zod';

import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { PeerReferenceService, withRequiredChatTarget } from '../../peer-reference.service.js';
import { jsonResult } from '../../tool-result.js';

const inputSchema = withRequiredChatTarget({
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
  public constructor(private readonly peerReferenceService: PeerReferenceService) {}

  public async execute(client: TelegramClient, input: unknown): Promise<CallToolResult> {
    const params = inputSchema.parse(input);
    const target = this.peerReferenceService.resolveTarget(params);
    const { message_ids, revoke } = params;

    await client.deleteMessagesById(target, message_ids, { revoke });

    return jsonResult({ deleted: message_ids });
  }
}
