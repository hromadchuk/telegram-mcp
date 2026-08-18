import { SetMetadata } from '@nestjs/common';
import type { CallToolResult, StandardSchemaWithJSON, ToolAnnotations } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';

export const MCP_TOOL_METADATA = Symbol('MCP_TOOL_METADATA');

type McpToolResult = CallToolResult | Promise<CallToolResult>;

export interface McpToolHandler {
  execute(input: unknown): McpToolResult;
}

export interface TelegramMcpToolHandler {
  execute(client: TelegramClient, input: unknown): McpToolResult;
}

interface BaseMcpToolOptions {
  name: string;
  title: string;
  description: string;
  annotations?: ToolAnnotations;
  inputSchema?: StandardSchemaWithJSON;
  outputSchema?: StandardSchemaWithJSON;
}

interface StandardMcpToolOptions extends BaseMcpToolOptions {
  requiresClient?: false;
}

interface TelegramMcpToolOptions extends BaseMcpToolOptions {
  requiresClient: true;
}

export type McpToolOptions = StandardMcpToolOptions | TelegramMcpToolOptions;

type ToolConstructor<T> = abstract new (...args: never[]) => T;
type ToolDecorator<T> = <Constructor extends ToolConstructor<T>>(target: Constructor) => Constructor | void;

export function McpTool(options: TelegramMcpToolOptions): ToolDecorator<TelegramMcpToolHandler>;
export function McpTool(options: StandardMcpToolOptions): ToolDecorator<McpToolHandler>;
export function McpTool(options: McpToolOptions): ClassDecorator {
  return SetMetadata(MCP_TOOL_METADATA, options);
}
