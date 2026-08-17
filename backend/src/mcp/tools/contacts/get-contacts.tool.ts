import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';

import { McpTool } from '../../decorators/mcp-tool.decorator.js';
import { TelegramMcpToolHandler } from '../../mcp-tool.handler.js';
import { jsonResult } from '../../tool-result.js';

@McpTool({
  name: 'get_contacts',
  title: 'Get contacts',
  description: 'Returns contacts saved in the connected account.',
  annotations: {
    readOnlyHint: true,
  },
})
@Injectable()
export class GetContactsTool extends TelegramMcpToolHandler {
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
    }));

    return jsonResult({ contacts });
  }
}
