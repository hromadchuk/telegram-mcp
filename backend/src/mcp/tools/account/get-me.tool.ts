import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';

import { McpTool } from '../../decorators/mcp-tool.decorator.js';
import { TelegramMcpToolHandler } from '../../mcp-tool.handler.js';
import { jsonResult } from '../../tool-result.js';

@McpTool({
  name: 'get_me',
  title: 'Get current user',
  description: 'Returns the public profile of the connected account.',
  annotations: {
    readOnlyHint: true,
  },
})
@Injectable()
export class GetMeTool extends TelegramMcpToolHandler {
  public async execute(client: TelegramClient): Promise<CallToolResult> {
    const user = await client.getMe();
    const profile = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      username: user.username,
      isPremium: user.isPremium,
    };

    return jsonResult(profile);
  }
}
