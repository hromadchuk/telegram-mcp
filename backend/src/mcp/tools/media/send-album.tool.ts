import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';
import { z } from 'zod';

import { mediaSourceSchema, toInputFile } from '../../common/media/upload.js';
import { serializeMessage } from '../../common/serializers/message.serializer.js';
import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { PeerReferenceService, withRequiredChatTarget } from '../../peer-reference.service.js';
import { jsonResult } from '../../tool-result.js';

const albumItemSchema = z.object({
  type: z.enum(['photo', 'file']),
  source: mediaSourceSchema,
  caption: z.string().optional(),
});
const inputSchema = withRequiredChatTarget({
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
  public constructor(private readonly peerReferenceService: PeerReferenceService) {}

  public async execute(client: TelegramClient, input: unknown): Promise<CallToolResult> {
    const params = inputSchema.parse(input);
    const target = this.peerReferenceService.resolveTarget(params);
    const { items, reply_to, silent } = params;
    const medias = items.map(({ type, source, caption }) => ({
      type: type === 'file' ? ('document' as const) : ('photo' as const),
      file: toInputFile(source),
      fileName: source.file_name,
      fileMime: source.mime_type,
      caption,
    }));
    const messages = await client.sendMediaGroup(target, medias, { replyTo: reply_to, silent });

    return jsonResult({ messages: messages.map(serializeMessage) });
  }
}
