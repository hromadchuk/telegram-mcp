import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';

type ToolResult = CallToolResult | Promise<CallToolResult>;

export abstract class McpToolHandler {
  public abstract execute(input: unknown): ToolResult;
}

export abstract class TelegramMcpToolHandler {
  public abstract execute(client: TelegramClient, input: unknown): ToolResult;
}
