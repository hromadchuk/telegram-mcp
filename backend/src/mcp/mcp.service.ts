import { Injectable } from '@nestjs/common';
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';
import { McpServer } from '@modelcontextprotocol/server';
import type { IncomingMessage, ServerResponse } from 'node:http';

import type { AccessToken } from '../auth/token.service.js';
import { isDev } from '../common/utils.js';
import { TelegramClientService } from '../telegram/telegram-client.service.js';

type McpRequest = IncomingMessage & {
  body?: unknown;
};

@Injectable()
export class McpService {
  public constructor(private readonly telegramClientService: TelegramClientService) {}

  public async handle(req: McpRequest, res: ServerResponse, accessToken: AccessToken): Promise<void> {
    const server = this.createServer(accessToken);
    const transport = new NodeStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    try {
      await server.connect(transport);
      this.enableDevLogging(transport);
      await transport.handleRequest(req, res, req.body);
    } finally {
      await server.close();
    }
  }

  private enableDevLogging(transport: NodeStreamableHTTPServerTransport): void {
    if (!isDev) {
      return;
    }

    const handleMessage = transport.onmessage;
    transport.onmessage = (message, extra) => {
      console.log('[MCP request]', JSON.stringify(message, null, 2));
      handleMessage?.(message, extra);
    };

    const send = transport.send.bind(transport);
    transport.send = async (message, options) => {
      console.log('[MCP response]', JSON.stringify(message, null, 2));
      await send(message, options);
    };
  }

  private createServer(accessToken: AccessToken): McpServer {
    const server = new McpServer({
      name: 'telegram-mcp',
      version: '0.0.0',
    });

    server.registerTool(
      'server_info',
      {
        title: 'Server info',
        description: 'Returns basic information about the Telegram MCP server.',
        annotations: {
          readOnlyHint: true,
        },
      },
      async () => ({
        content: [
          {
            type: 'text',
            text: 'Telegram MCP server is running and the Telegram session is authorized.',
          },
        ],
      }),
    );

    server.registerTool(
      'get_me',
      {
        title: 'Get current Telegram user',
        description: 'Returns the public profile of the Telegram account connected to this MCP server.',
        annotations: {
          readOnlyHint: true,
        },
      },
      async () => {
        const profile = await this.telegramClientService.getMe(accessToken);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(profile, null, 2),
            },
          ],
          structuredContent: profile,
        };
      },
    );

    return server;
  }
}
