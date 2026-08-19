import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';
import { z } from 'zod';

import { serializeMessage } from '../../common/serializers/message.serializer.js';
import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { PeerReferenceService, withRequiredChatTarget } from '../../peer-reference.service.js';
import { jsonResult } from '../../tool-result.js';

const inputSchema = withRequiredChatTarget({
  text: z.string().min(1),
  reply_to: z.number().int().positive().optional(),
  silent: z.boolean().optional(),
  disable_web_preview: z.boolean().optional(),
});

@McpTool({
  name: 'send_message',
  title: 'Send message',
  description:
    'Sends a text message. Prefer chat_ref returned by search_chats; @username also works. A numeric chat_id may require a cached peer.',
  requiresClient: true,
  inputSchema,
  annotations: { destructiveHint: true, openWorldHint: true },
})
@Injectable()
export class SendMessageTool implements TelegramMcpToolHandler {
  public constructor(private readonly peerReferenceService: PeerReferenceService) {}

  public async execute(client: TelegramClient, input: unknown): Promise<CallToolResult> {
    const params = inputSchema.parse(input);
    const target = this.peerReferenceService.resolveTarget(params);
    const { text, reply_to, silent, disable_web_preview } = params;
    const message = await client.sendText(target, text, {
      replyTo: reply_to,
      silent,
      disableWebPreview: disable_web_preview,
    });

    return jsonResult({ message: serializeMessage(message) });
  }
}
