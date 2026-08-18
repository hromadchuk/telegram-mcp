import { Injectable } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { McpServer, type CallToolResult } from '@modelcontextprotocol/server';
import { MemoryStorage, TelegramClient } from '@mtcute/node';

import type { AccessToken } from '../auth/token.service.js';
import {
  MCP_TOOL_METADATA,
  type McpToolHandler,
  type McpToolOptions,
  type TelegramMcpToolHandler,
} from './decorators/mcp-tool.decorator.js';

interface ToolProvider {
  handler: McpToolHandler | TelegramMcpToolHandler;
  options: McpToolOptions;
}

@Injectable()
export class McpToolRegistry {
  public constructor(private readonly discoveryService: DiscoveryService) {}

  public register(server: McpServer, accessToken: AccessToken): void {
    const names = new Set<string>();

    for (const { handler, options } of this.getTools()) {
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
        server.registerTool(options.name, { ...config, inputSchema: options.inputSchema }, async (input) =>
          this.execute(handler, options.requiresClient, accessToken, input),
        );
      } else {
        server.registerTool(options.name, config, async () => {
          return this.execute(handler, options.requiresClient, accessToken, undefined);
        });
      }
    }
  }

  private getTools(): ToolProvider[] {
    const tools: ToolProvider[] = [];

    for (const { instance } of this.discoveryService.getProviders()) {
      if (!instance || typeof instance !== 'object') {
        continue;
      }

      const options = Reflect.getOwnMetadata(MCP_TOOL_METADATA, instance.constructor) as McpToolOptions | undefined;

      if (!options) {
        continue;
      }

      if (!('execute' in instance) || typeof instance.execute !== 'function') {
        throw new Error(`MCP tool ${options.name} must implement execute().`);
      }

      tools.push({
        handler: instance as McpToolHandler | TelegramMcpToolHandler,
        options,
      });
    }

    return tools;
  }

  private async execute(
    handler: McpToolHandler | TelegramMcpToolHandler,
    requiresClient: boolean | undefined,
    accessToken: AccessToken,
    input: unknown,
  ): Promise<CallToolResult> {
    if (!requiresClient) {
      return (handler as McpToolHandler).execute(input);
    }

    const client = new TelegramClient({
      apiId: accessToken.apiId,
      apiHash: accessToken.apiHash,
      storage: new MemoryStorage(),
      disableUpdates: true,
      network: {
        middlewares: [],
      },
    });

    try {
      await client.importSession(accessToken.session);

      return await (handler as TelegramMcpToolHandler).execute(client, input);
    } finally {
      await client.destroy();
    }
  }
}
