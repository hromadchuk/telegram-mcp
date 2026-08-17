import { SetMetadata } from '@nestjs/common';
import type { StandardSchemaWithJSON, ToolAnnotations } from '@modelcontextprotocol/server';

export const MCP_TOOL_METADATA = Symbol('MCP_TOOL_METADATA');

export interface McpToolOptions {
  name: string;
  title: string;
  description: string;
  annotations?: ToolAnnotations;
  inputSchema?: StandardSchemaWithJSON;
  outputSchema?: StandardSchemaWithJSON;
}

export const McpTool = (options: McpToolOptions): ClassDecorator => SetMetadata(MCP_TOOL_METADATA, options);
