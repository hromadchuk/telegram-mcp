import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';
import { z } from 'zod';

import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { PeerReferenceService, withRequiredChatTarget } from '../../peer-reference.service.js';
import { jsonResult } from '../../tool-result.js';

const inputSchema = withRequiredChatTarget({
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
  public constructor(private readonly peerReferenceService: PeerReferenceService) {}

  public async execute(client: TelegramClient, input: unknown): Promise<CallToolResult> {
    const params = inputSchema.parse(input);
    const target = this.peerReferenceService.resolveTarget(params);
    const { max_id, clear_mentions } = params;

    await client.readHistory(target, { maxId: max_id, clearMentions: clear_mentions });

    return jsonResult({ success: true });
  }
}
