import { Injectable } from '@nestjs/common';
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';
import { McpServer } from '@modelcontextprotocol/server';
import type { IncomingMessage, ServerResponse } from 'node:http';

import type { AccessToken } from '../auth/token.service.js';
import { isDev } from '../common/utils.js';
import { McpToolRegistry } from './mcp-tool.registry.js';

type McpRequest = IncomingMessage & {
  body?: unknown;
};

@Injectable()
export class McpService {
  public constructor(private readonly toolRegistry: McpToolRegistry) {}

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

    this.toolRegistry.register(server, accessToken);

    return server;
  }
}
