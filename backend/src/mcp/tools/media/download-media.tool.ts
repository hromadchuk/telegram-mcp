import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';
import { z } from 'zod';

import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';

const inputSchema = z.object({
  file_id: z.string().trim().min(1).describe('Telegram file ID returned in a message media object.'),
  file_name: z.string().trim().min(1).optional(),
  mime_type: z.string().trim().min(1).optional().describe('MIME type returned in the message media object.'),
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
    const contents = await client.downloadAsBuffer(file_id);
    const name = file_name ?? 'download';
    const mimeType = mime_type ?? 'application/octet-stream';
    const data = Buffer.from(contents).toString('base64');

    if (mimeType.startsWith('image/')) {
      return {
        content: [{ type: 'image', data, mimeType }],
      };
    }

    return {
      content: [
        {
          type: 'resource',
          resource: {
            uri: `telegram://media/${encodeURIComponent(name)}`,
            mimeType,
            blob: data,
          },
        },
      ],
    };
  }
}
