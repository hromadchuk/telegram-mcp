import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';
import { z } from 'zod';

import { mediaSourceSchema, toInputFile } from '../../common/media/upload.js';
import { serializeMessage } from '../../common/serializers/message.serializer.js';
import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { PeerReferenceService, withRequiredChatTarget } from '../../peer-reference.service.js';
import { jsonResult } from '../../tool-result.js';

const inputSchema = withRequiredChatTarget({
  source: mediaSourceSchema,
  caption: z.string().optional(),
  reply_to: z.number().int().positive().optional(),
  silent: z.boolean().optional(),
});

@McpTool({
  name: 'send_file',
  title: 'Send file',
  description: 'Uploads and sends a document from a URL, Telegram file ID, or base64 data.',
  requiresClient: true,
  inputSchema,
  annotations: { destructiveHint: true, openWorldHint: true },
})
@Injectable()
export class SendFileTool implements TelegramMcpToolHandler {
  public constructor(private readonly peerReferenceService: PeerReferenceService) {}

  public async execute(client: TelegramClient, input: unknown): Promise<CallToolResult> {
    const params = inputSchema.parse(input);
    const target = this.peerReferenceService.resolveTarget(params);
    const { source, caption, reply_to, silent } = params;
    const message = await client.sendMedia(
      target,
      {
        type: 'document',
        file: toInputFile(source),
        fileName: source.file_name,
        fileMime: source.mime_type,
      },
      { caption, replyTo: reply_to, silent },
    );

    return jsonResult({ message: serializeMessage(message) });
  }
}
