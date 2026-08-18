import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';

import { serializeStarsAmount } from '../../common/serializers/stars.serializer.js';
import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { jsonResult } from '../../tool-result.js';

@McpTool({
  name: 'get_stars_balance',
  title: 'Get Stars balance',
  description: 'Returns the current Telegram Stars balance of the connected account.',
  requiresClient: true,
  annotations: { readOnlyHint: true },
})
@Injectable()
export class GetStarsBalanceTool implements TelegramMcpToolHandler {
  public async execute(client: TelegramClient): Promise<CallToolResult> {
    const peer = await client.resolvePeer('self');
    const status = await client.call({ _: 'payments.getStarsStatus', peer });

    return jsonResult({ balance: serializeStarsAmount(status.balance) });
  }
}
