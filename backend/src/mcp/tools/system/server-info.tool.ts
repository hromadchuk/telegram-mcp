import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';

import { McpTool } from '../../decorators/mcp-tool.decorator.js';
import { McpToolHandler } from '../../mcp-tool.handler.js';
import { textResult } from '../../tool-result.js';

@McpTool({
  name: 'server_info',
  title: 'Server info',
  description: 'Returns basic information about the MCP server.',
  annotations: {
    readOnlyHint: true,
  },
})
@Injectable()
export class ServerInfoTool extends McpToolHandler {
  public execute(): CallToolResult {
    return textResult('The MCP server is running and the session is authorized.');
  }
}
