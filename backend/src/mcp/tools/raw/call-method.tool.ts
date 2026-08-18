import type { TelegramClient } from '@mtcute/node';
import { Injectable } from '@nestjs/common';
import { INVALID_REQUEST, ProtocolError, type CallToolResult } from '@modelcontextprotocol/server';
import { z } from 'zod';

import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { jsonResult } from '../../tool-result.js';
import { getBlockedMethodReason } from './blocked-methods.js';
import { TlCatalogService } from './tl-catalog.service.js';
import { createTlRequest, serializeTlValue } from './tl.utils.js';

const inputSchema = z.object({
  method: z.string().trim().min(1).describe('Exact method name returned by search_methods.'),
  params: z
    .record(z.string(), z.unknown())
    .default({})
    .describe('Method parameters using TL snake_case names. Long values should be decimal strings.'),
});

@McpTool({
  name: 'call_method',
  title: 'Call method',
  description:
    'Calls a raw Telegram API method. Use search_methods and get_method_schema first to discover its exact parameters.',
  requiresClient: true,
  inputSchema,
  annotations: {
    openWorldHint: true,
  },
})
@Injectable()
export class CallMethodTool implements TelegramMcpToolHandler {
  public constructor(private readonly catalog: TlCatalogService) {}

  public async execute(client: TelegramClient, input: unknown): Promise<CallToolResult> {
    const { method: methodName, params } = inputSchema.parse(input);
    const blockedReason = getBlockedMethodReason(methodName);

    if (blockedReason) {
      throw new ProtocolError(INVALID_REQUEST, `${methodName} is blocked: ${blockedReason}`);
    }

    const method = this.catalog.getMethod(methodName);
    const request = createTlRequest(this.catalog, method, params);
    const result = await client.call(request);

    return jsonResult({
      method: method.name,
      result: serializeTlValue(result),
    });
  }
}
