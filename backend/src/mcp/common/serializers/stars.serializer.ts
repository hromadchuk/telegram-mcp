import type { StarsTransaction, StarsTransactionType, tl } from '@mtcute/core';

import { serializeMedia } from './media.serializer.js';
import { serializePeer } from './peer.serializer.js';
import { serializeStarGift } from './gift.serializer.js';

export function serializeStarsAmount(amount: tl.TypeStarsAmount): Record<string, unknown> {
  if (amount._ === 'starsTonAmount') {
    return {
      currency: 'Gram',
      nanograms: amount.amount.toString(),
    };
  }

  return {
    currency: 'stars',
    amount: amount.amount.toString(),
    nanos: amount.nanos,
  };
}

export function serializeStarsTransaction(transaction: StarsTransaction): Record<string, unknown> {
  return {
    id: transaction.id,
    direction: transaction.direction,
    amount: serializeStarsAmount(transaction.amount),
    date: transaction.date.toISOString(),
    isRefund: transaction.isRefund,
    viaBusinessBot: transaction.viaBusinessBot,
    details: serializeTransactionDetails(transaction.type),
  };
}

function serializeTransactionDetails(details: StarsTransactionType): Record<string, unknown> {
  switch (details.type) {
    case 'fragment_withdraw':
      return {
        type: details.type,
        status: details.status,
        date: details.date?.toISOString() ?? null,
        url: details.url ?? null,
      };
    case 'reaction':
    case 'giveaway':
      return { type: details.type, peer: serializePeer(details.peer), messageId: details.messageId };
    case 'gift':
      return { type: details.type, user: serializePeer(details.user) };
    case 'media_purchase':
      return {
        type: details.type,
        peer: serializePeer(details.peer),
        messageId: details.messageId,
        media: details.media?.map(serializeMedia) ?? null,
      };
    case 'bot_purchase':
      return {
        type: details.type,
        user: serializePeer(details.user),
        title: details.title,
        description: details.description ?? null,
        payload: details.payload ? Buffer.from(details.payload).toString('base64') : null,
      };
    case 'channel_subscription':
      return { type: details.type, peer: serializePeer(details.peer), period: details.period };
    case 'star_gift':
    case 'star_gift_upgrade':
    case 'star_gift_resale':
    case 'star_gift_offer':
    case 'star_gift_prepaid_upgrade':
    case 'star_gift_drop_details':
      return { type: details.type, peer: serializePeer(details.peer), gift: serializeStarGift(details.gift) };
    case 'star_gift_transfer':
      return {
        type: details.type,
        recipient: serializePeer(details.recipient),
        gift: serializeStarGift(details.gift),
      };
    case 'paid_message':
      return { type: details.type, peer: serializePeer(details.peer), count: details.count };
    case 'premium_gift':
      return { type: details.type, peer: serializePeer(details.peer), months: details.months };
    case 'api_floodskip':
      return { type: details.type, count: details.count };
    case 'bot_referral':
      return { type: details.type, peer: serializePeer(details.peer), commission: details.commission };
    case 'ads_proceeds':
      return {
        type: details.type,
        peer: serializePeer(details.peer),
        fromDate: details.fromDate.toISOString(),
        toDate: details.toDate.toISOString(),
      };
    default:
      return { type: details.type };
  }
}
