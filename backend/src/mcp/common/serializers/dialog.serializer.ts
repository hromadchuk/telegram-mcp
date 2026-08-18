import type { Dialog } from '@mtcute/core';

import { serializeMessage } from './message.serializer.js';
import { serializePeer } from './peer.serializer.js';

export function serializeDialog(dialog: Dialog): Record<string, unknown> {
  return {
    peer: serializePeer(dialog.peer),
    isPinned: dialog.isPinned,
    isArchived: dialog.isArchived,
    isMuted: dialog.isMuted,
    isUnread: dialog.isUnread,
    unreadCount: dialog.unreadCount,
    unreadMentionsCount: dialog.unreadMentionsCount,
    lastMessage: dialog.lastMessage ? serializeMessage(dialog.lastMessage) : null,
  };
}
