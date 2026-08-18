import type { Message } from '@mtcute/core';

import { serializeMedia } from './media.serializer.js';
import { serializePeer } from './peer.serializer.js';

export function serializeMessage(message: Message): Record<string, unknown> {
  return {
    id: message.id,
    chat: serializePeer(message.chat),
    sender: serializePeer(message.sender),
    date: message.date.toISOString(),
    editDate: message.editDate?.toISOString() ?? null,
    text: message.text,
    isOutgoing: message.isOutgoing,
    isService: message.isService,
    isPinned: message.isPinned,
    replyToMessageId: message.replyToMessage?.id ?? null,
    groupedId: message.groupedId?.toString() ?? null,
    media: serializeMedia(message.media),
  };
}
