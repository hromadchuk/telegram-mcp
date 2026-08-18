import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';
import { z } from 'zod';

import { mediaSourceSchema, toInputFile } from '../../common/media/upload.js';
import { serializeMessage } from '../../common/serializers/message.serializer.js';
import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { jsonResult } from '../../tool-result.js';

const albumItemSchema = z.object({
  type: z.enum(['photo', 'file']),
  source: mediaSourceSchema,
  caption: z.string().optional(),
});
const inputSchema = z.object({
  chat_id: z.union([z.number().int(), z.string().trim().min(1)]),
  items: z.array(albumItemSchema).min(2).max(10),
  reply_to: z.number().int().positive().optional(),
  silent: z.boolean().optional(),
});

@McpTool({
  name: 'send_album',
  title: 'Send album',
  description: 'Uploads and sends 2–10 photos or files as one media album.',
  requiresClient: true,
  inputSchema,
  annotations: { destructiveHint: true, openWorldHint: true },
})
@Injectable()
export class SendAlbumTool implements TelegramMcpToolHandler {
  public async execute(client: TelegramClient, input: unknown): Promise<CallToolResult> {
    const { chat_id, items, reply_to, silent } = inputSchema.parse(input);
    const medias = items.map(({ type, source, caption }) => ({
      type: type === 'file' ? ('document' as const) : ('photo' as const),
      file: toInputFile(source),
      fileName: source.file_name,
      fileMime: source.mime_type,
      caption,
    }));
    const messages = await client.sendMediaGroup(chat_id, medias, { replyTo: reply_to, silent });

    return jsonResult({ messages: messages.map(serializeMessage) });
  }
}
