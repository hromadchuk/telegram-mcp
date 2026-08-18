import { Injectable } from '@nestjs/common';
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';
import { McpServer } from '@modelcontextprotocol/server';
import type { IncomingMessage, ServerResponse } from 'node:http';

import type { AccessToken } from '../auth/token.service.js';
import { devLogging } from './mcp-dev-logging.js';
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
      devLogging(transport);
      await transport.handleRequest(req, res, req.body);
    } finally {
      await server.close();
    }
  }

  private createServer(accessToken: AccessToken): McpServer {
    const server = new McpServer({
      name: 'telegram-mcp',
      version: '0.1.0',
    });

    this.toolRegistry.register(server, accessToken);

    return server;
  }
}
