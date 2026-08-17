import { Injectable } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { McpServer, type CallToolResult } from '@modelcontextprotocol/server';
import { MemoryStorage, TelegramClient } from '@mtcute/node';

import type { AccessToken } from '../auth/token.service.js';
import { MCP_TOOL_METADATA, type McpToolOptions } from './decorators/mcp-tool.decorator.js';
import { McpToolHandler, TelegramMcpToolHandler } from './mcp-tool.handler.js';

type ToolHandler = McpToolHandler | TelegramMcpToolHandler;

@Injectable()
export class McpToolRegistry {
  public constructor(private readonly discoveryService: DiscoveryService) {}

  public register(server: McpServer, accessToken: AccessToken): void {
    const names = new Set<string>();

    for (const handler of this.getHandlers()) {
      const options = Reflect.getMetadata(MCP_TOOL_METADATA, handler.constructor) as McpToolOptions | undefined;
      if (!options) {
        continue;
      }

      if (names.has(options.name)) {
        throw new Error(`MCP tool ${options.name} is registered more than once.`);
      }
      names.add(options.name);

      const config = {
        title: options.title,
        description: options.description,
        annotations: options.annotations,
        outputSchema: options.outputSchema,
      };

      if (options.inputSchema) {
        server.registerTool(
          options.name,
          { ...config, inputSchema: options.inputSchema },
          async (input) => this.execute(handler, accessToken, input),
        );
      } else {
        server.registerTool(options.name, config, async () => this.execute(handler, accessToken, undefined));
      }
    }
  }

  private getHandlers(): ToolHandler[] {
    return this.discoveryService
      .getProviders()
      .map(({ instance }) => instance)
      .filter((instance): instance is ToolHandler => {
        return instance instanceof McpToolHandler || instance instanceof TelegramMcpToolHandler;
      });
  }

  private async execute(handler: ToolHandler, accessToken: AccessToken, input: unknown): Promise<CallToolResult> {
    if (!(handler instanceof TelegramMcpToolHandler)) {
      return handler.execute(input);
    }

    const client = new TelegramClient({
      apiId: accessToken.apiId,
      apiHash: accessToken.apiHash,
      storage: new MemoryStorage(),
      disableUpdates: true,
    });

    try {
      await client.importSession(accessToken.session);
      return await handler.execute(client, input);
    } finally {
      await client.destroy();
    }
  }
}
