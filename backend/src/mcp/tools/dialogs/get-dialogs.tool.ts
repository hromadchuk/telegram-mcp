import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';
import { z } from 'zod';

import { serializeDialog } from '../../common/serializers/dialog.serializer.js';
import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import {
  peerIdSchema,
  peerReferenceSchema,
  PeerReferenceService,
  type PeerReference,
} from '../../peer-reference.service.js';
import { jsonResult } from '../../tool-result.js';

const inputSchema = z.object({
  limit: z.number().int().min(1).max(500).default(100),
  archived: z.enum(['keep', 'exclude', 'only']).default('exclude'),
  offset_id: z.number().int().min(0).optional(),
  offset_date: z.iso.datetime().optional(),
  offset_peer: peerIdSchema.optional(),
  offset_peer_ref: peerReferenceSchema.optional(),
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
  public constructor(private readonly peerReferenceService: PeerReferenceService) {}

  public async execute(client: TelegramClient, input: unknown): Promise<CallToolResult> {
    const params = inputSchema.parse(input);
    let offsetPeer;

    if (params.offset_peer_ref) {
      offsetPeer = this.peerReferenceService.open(params.offset_peer_ref);
    } else if (params.offset_peer) {
      offsetPeer = await client.resolvePeer(params.offset_peer);
    }
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
    let nextOffset: { id: number; date: string; peer_ref: PeerReference } | null = null;

    if (last) {
      nextOffset = {
        id: last.id,
        date: last.date.toISOString(),
        peer_ref: this.peerReferenceService.fromPeer(last.chat),
      };
    }

    return jsonResult({
      dialogs: dialogs.map((dialog) => ({
        ...serializeDialog(dialog),
        chat_ref: this.peerReferenceService.fromPeer(dialog.peer),
      })),
      nextOffset,
    });
  }
}
