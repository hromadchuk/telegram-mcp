import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';
import { z } from 'zod';

import { serializeMessage } from '../../common/serializers/message.serializer.js';
import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { jsonResult } from '../../tool-result.js';

const inputSchema = z.object({
  chat_id: z.union([z.number().int(), z.string().trim().min(1)]),
  text: z.string().min(1),
  reply_to: z.number().int().positive().optional(),
  silent: z.boolean().optional(),
  disable_web_preview: z.boolean().optional(),
});

@McpTool({
  name: 'send_message',
  title: 'Send message',
  description: 'Sends a text message to a user, group, or channel.',
  requiresClient: true,
  inputSchema,
  annotations: { destructiveHint: true, openWorldHint: true },
})
@Injectable()
export class SendMessageTool implements TelegramMcpToolHandler {
  public async execute(client: TelegramClient, input: unknown): Promise<CallToolResult> {
    const { chat_id, text, reply_to, silent, disable_web_preview } = inputSchema.parse(input);
    const message = await client.sendText(chat_id, text, {
      replyTo: reply_to,
      silent,
      disableWebPreview: disable_web_preview,
    });

    return jsonResult({ message: serializeMessage(message) });
  }
}
