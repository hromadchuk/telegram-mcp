import type { Peer } from '@mtcute/core';

export function serializePeer(peer: Peer): Record<string, unknown> {
  if (peer.type === 'user') {
    return {
      id: peer.id,
      type: peer.isBot ? 'bot' : 'user',
      displayName: peer.displayName,
      firstName: peer.firstName,
      lastName: peer.lastName,
      username: peer.username,
      phoneNumber: peer.phoneNumber,
      isContact: peer.isContact,
      isPremium: peer.isPremium,
    };
  }

  return {
    id: peer.id,
    type: peer.chatType,
    displayName: peer.displayName,
    username: peer.username,
    membersCount: peer.membersCount,
    isMember: peer.isMember,
    isAdmin: peer.isAdmin,
    isCreator: peer.isCreator,
    isForum: peer.isForum,
  };
}
