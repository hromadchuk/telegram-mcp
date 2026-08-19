import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type { TelegramClient } from '@mtcute/node';
import { z } from 'zod';

import { serializeStarsAmount, serializeStarsTransaction } from '../../common/serializers/stars.serializer.js';
import { McpTool, type TelegramMcpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { peerIdSchema, peerReferenceSchema, PeerReferenceService } from '../../peer-reference.service.js';
import { jsonResult } from '../../tool-result.js';

const inputSchema = z.object({
  peer: peerIdSchema.optional(),
  peer_ref: peerReferenceSchema.optional(),
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
  public constructor(private readonly peerReferenceService: PeerReferenceService) {}

  public async execute(client: TelegramClient, input: unknown): Promise<CallToolResult> {
    const { peer, peer_ref, direction, sort, subscription_id, offset, limit, ton } = inputSchema.parse(input);
    const target = peer || peer_ref ? this.peerReferenceService.resolveOptionalTarget(peer, peer_ref) : 'self';
    const status = await client.getStarsTransactions(target, {
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
