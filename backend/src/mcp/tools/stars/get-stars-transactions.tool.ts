import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';
import { z } from 'zod';

import { serializeStarsAmount, serializeStarsTransaction } from '../../common/serializers/stars.serializer.js';
import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { jsonResult } from '../../tool-result.js';

const inputSchema = z.object({
  peer: z.union([z.number().int(), z.string().trim().min(1)]).default('self'),
  direction: z.enum(['incoming', 'outgoing']).optional(),
  sort: z.enum(['asc', 'desc']).default('desc'),
  subscription_id: z.string().trim().min(1).optional(),
  offset: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(100),
  ton: z.boolean().default(false),
});

@McpTool({
  name: 'get_stars_transactions',
  title: 'Get Stars transactions',
  description: 'Returns paginated Telegram Stars transactions for the current account, a bot, or a channel.',
  requiresClient: true,
  inputSchema,
  annotations: { readOnlyHint: true },
})
@Injectable()
export class GetStarsTransactionsTool implements TelegramMcpToolHandler {
  public async execute(client: TelegramClient, input: unknown): Promise<CallToolResult> {
    const { peer, direction, sort, subscription_id, offset, limit, ton } = inputSchema.parse(input);
    const status = await client.getStarsTransactions(peer, {
      direction,
      sort,
      subscriptionId: subscription_id,
      offset,
      limit,
      ton,
    });

    return jsonResult({
      balance: serializeStarsAmount(status.balance),
      transactions: status.transactions.map(serializeStarsTransaction),
      nextOffset: status.transactionsNextOffset,
    });
  }
}
