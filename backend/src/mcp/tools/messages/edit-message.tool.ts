import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';
import { z } from 'zod';

import { serializeMessage } from '../../common/serializers/message.serializer.js';
import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { PeerReferenceService, withRequiredChatTarget } from '../../peer-reference.service.js';
import { jsonResult } from '../../tool-result.js';

const inputSchema = withRequiredChatTarget({
  message_id: z.number().int().positive(),
  text: z.string().min(1),
  disable_web_preview: z.boolean().optional(),
});

@McpTool({
  name: 'edit_message',
  title: 'Edit message',
  description: 'Edits the text or caption of a sent message.',
  requiresClient: true,
  inputSchema,
  annotations: { destructiveHint: true, idempotentHint: true },
})
@Injectable()
export class EditMessageTool implements TelegramMcpToolHandler {
  public constructor(private readonly peerReferenceService: PeerReferenceService) {}

  public async execute(client: TelegramClient, input: unknown): Promise<CallToolResult> {
    const params = inputSchema.parse(input);
    const target = this.peerReferenceService.resolveTarget(params);
    const { message_id, text, disable_web_preview } = params;
    const message = await client.editMessage({
      chatId: target,
      message: message_id,
      text,
      disableWebPreview: disable_web_preview,
    });

    return jsonResult({ message: serializeMessage(message) });
  }
}
