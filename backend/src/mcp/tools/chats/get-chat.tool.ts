import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';
import { z } from 'zod';

import { serializePeer } from '../../common/serializers/peer.serializer.js';
import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { jsonResult } from '../../tool-result.js';

const inputSchema = z.object({
  chat_id: z.union([z.number().int(), z.string().trim().min(1)]),
});

@McpTool({
  name: 'get_chat',
  title: 'Get chat',
  description: 'Returns information about a user, group, or channel.',
  requiresClient: true,
  inputSchema,
  annotations: { readOnlyHint: true },
})
@Injectable()
export class GetChatTool implements TelegramMcpToolHandler {
  public async execute(client: TelegramClient, input: unknown): Promise<CallToolResult> {
    const { chat_id } = inputSchema.parse(input);
    const inputPeer = await client.resolvePeer(chat_id);

    if (inputPeer._ === 'inputPeerUser' || inputPeer._ === 'inputPeerSelf') {
      const user = await client.getUser(chat_id);

      return jsonResult({ peer: serializePeer(user) });
    }

    const chat = await client.getChat(chat_id);

    return jsonResult({ peer: serializePeer(chat) });
  }
}
