import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';
import { z } from 'zod';

import { serializePeer } from '../../common/serializers/peer.serializer.js';
import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { PeerReferenceService, withRequiredChatTarget } from '../../peer-reference.service.js';
import { jsonResult } from '../../tool-result.js';

const inputSchema = withRequiredChatTarget({});

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
  public constructor(private readonly peerReferenceService: PeerReferenceService) {}

  public async execute(client: TelegramClient, input: unknown): Promise<CallToolResult> {
    const params = inputSchema.parse(input);
    const target = this.peerReferenceService.resolveTarget(params);
    const inputPeer =
      'chat_ref' in params ? this.peerReferenceService.open(params.chat_ref) : await client.resolvePeer(target);

    if (inputPeer._ === 'inputPeerUser' || inputPeer._ === 'inputPeerSelf') {
      const user = await client.getUser(target);

      return jsonResult({ peer: serializePeer(user), chat_ref: this.peerReferenceService.fromPeer(user) });
    }

    const chat = await client.getChat(target);

    return jsonResult({ peer: serializePeer(chat), chat_ref: this.peerReferenceService.fromPeer(chat) });
  }
}
