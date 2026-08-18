import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import { z } from 'zod';

import { McpTool, type McpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { jsonResult } from '../../tool-result.js';
import { TlCatalogService } from './tl-catalog.service.js';

const inputSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1)
    .regex(/[a-z0-9]/i, 'Query must contain letters or numbers.')
    .describe('Method name or words from its description.'),
});

@McpTool({
  name: 'search_methods',
  title: 'Search methods',
  description: 'Searches all available raw API methods by name or description.',
  inputSchema,
  annotations: {
    readOnlyHint: true,
  },
})
@Injectable()
export class SearchMethodsTool implements McpToolHandler {
  public constructor(private readonly catalog: TlCatalogService) {}

  public execute(input: unknown): CallToolResult {
    const { query } = inputSchema.parse(input);
    const methods = this.catalog.search(query);

    return jsonResult({
      layer: this.catalog.layer,
      count: methods.length,
      methods,
    });
  }
}
