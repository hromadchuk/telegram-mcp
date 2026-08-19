import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';

import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { PeerReferenceService } from '../../peer-reference.service.js';
import { jsonResult } from '../../tool-result.js';

@McpTool({
  name: 'get_contacts',
  title: 'Get contacts',
  description: 'Returns contacts saved in the connected account.',
  requiresClient: true,
  annotations: {
    readOnlyHint: true,
  },
})
@Injectable()
export class GetContactsTool implements TelegramMcpToolHandler {
  public constructor(private readonly peerReferenceService: PeerReferenceService) {}

  public async execute(client: TelegramClient): Promise<CallToolResult> {
    const users = await client.getContacts();
    const contacts = users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      username: user.username,
      phoneNumber: user.phoneNumber,
      isBot: user.isBot,
      isPremium: user.isPremium,
      isMutualContact: user.isMutualContact,
      chat_ref: this.peerReferenceService.fromPeer(user),
    }));

    return jsonResult({ contacts });
  }
}
