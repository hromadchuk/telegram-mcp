import { Injectable } from '@nestjs/common';
import { INVALID_REQUEST, ProtocolError, type CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';
import { z } from 'zod';

import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { MAX_INLINE_MEDIA_BYTES } from '../../common/media/media.constants.js';

const inputSchema = z.object({
  file_id: z.string().trim().min(1).describe('Telegram file ID returned in a message media object.'),
  file_name: z.string().trim().min(1).optional(),
  mime_type: z.string().trim().min(1).optional(),
});

@McpTool({
  name: 'download_media',
  title: 'Download media',
  description: 'Downloads Telegram media by file ID and returns its contents as base64.',
  requiresClient: true,
  inputSchema,
  annotations: { readOnlyHint: true },
})
@Injectable()
export class DownloadMediaTool implements TelegramMcpToolHandler {
  public async execute(client: TelegramClient, input: unknown): Promise<CallToolResult> {
    const { file_id, file_name, mime_type } = inputSchema.parse(input);
    const contents = await client.downloadAsBuffer(file_id, { limit: MAX_INLINE_MEDIA_BYTES + 1 });

    if (contents.length > MAX_INLINE_MEDIA_BYTES) {
      throw new ProtocolError(
        INVALID_REQUEST,
        'The file exceeds the 3 MB inline download limit imposed by the Vercel response size.',
      );
    }

    const name = file_name ?? 'download';
    const mimeType = mime_type ?? 'application/octet-stream';

    return {
      content: [
        {
          type: 'resource',
          resource: {
            uri: `telegram://media/${encodeURIComponent(name)}`,
            mimeType,
            blob: Buffer.from(contents).toString('base64'),
          },
        },
      ],
    };
  }
}
