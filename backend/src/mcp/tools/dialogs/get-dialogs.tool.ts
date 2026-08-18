import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';
import { z } from 'zod';

import { serializeDialog } from '../../common/serializers/dialog.serializer.js';
import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { jsonResult } from '../../tool-result.js';

const inputSchema = z.object({
  limit: z.number().int().min(1).max(500).default(100),
  archived: z.enum(['keep', 'exclude', 'only']).default('exclude'),
  offset_id: z.number().int().min(0).optional(),
  offset_date: z.iso.datetime().optional(),
  offset_peer: z.union([z.number().int(), z.string().trim().min(1)]).optional(),
});

@McpTool({
  name: 'get_dialogs',
  title: 'Get dialogs',
  description: 'Returns private chats, groups, and channels from the dialog list.',
  requiresClient: true,
  inputSchema,
  annotations: { readOnlyHint: true },
})
@Injectable()
export class GetDialogsTool implements TelegramMcpToolHandler {
  public async execute(client: TelegramClient, input: unknown): Promise<CallToolResult> {
    const params = inputSchema.parse(input);
    const offsetPeer = params.offset_peer ? await client.resolvePeer(params.offset_peer) : undefined;
    const dialogs = [];

    for await (const dialog of client.iterDialogs({
      limit: params.limit,
      archived: params.archived,
      offsetId: params.offset_id,
      offsetDate: params.offset_date ? new Date(params.offset_date) : undefined,
      offsetPeer,
    })) {
      dialogs.push(dialog);
    }

    const last = dialogs.at(-1)?.lastMessage;
    let nextOffset: { id: number; date: string; peer: number } | null = null;

    if (last) {
      nextOffset = {
        id: last.id,
        date: last.date.toISOString(),
        peer: last.chat.id,
      };
    }

    return jsonResult({
      dialogs: dialogs.map(serializeDialog),
      nextOffset,
    });
  }
}
