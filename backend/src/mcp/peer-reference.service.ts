import { Injectable } from '@nestjs/common';
import type { Peer, tl } from '@mtcute/core';
import { INVALID_PARAMS, ProtocolError } from '@modelcontextprotocol/server';
import Long from 'long';
import { z } from 'zod';

export const peerIdSchema = z.union([z.number().int(), z.string().trim().min(1)]);
export const peerReferenceSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('chat'), chat_id: z.number().int() }),
  z.object({ type: z.literal('user'), user_id: z.number().int(), access_hash: z.string().min(1) }),
  z.object({ type: z.literal('channel'), channel_id: z.number().int(), access_hash: z.string().min(1) }),
]);

export function withRequiredChatTarget<T extends z.ZodRawShape>(fields: T) {
  return z.union([
    z.object({ ...fields, chat_id: peerIdSchema }).strict(),
    z.object({ ...fields, chat_ref: peerReferenceSchema }).strict(),
  ]);
}

export type PeerReference =
  | { type: 'chat'; chat_id: number }
  | { type: 'user'; user_id: number; access_hash: string }
  | { type: 'channel'; channel_id: number; access_hash: string };

export type PeerTarget = { chat_id: number | string } | { chat_ref: PeerReference };

@Injectable()
export class PeerReferenceService {
  public fromPeer(peer: Peer): PeerReference {
    return this.serialize(peer.inputPeer);
  }

  public open(reference: PeerReference): tl.TypeInputPeer {
    switch (reference.type) {
      case 'chat':
        return { _: 'inputPeerChat', chatId: reference.chat_id };
      case 'user':
        return {
          _: 'inputPeerUser',
          userId: reference.user_id,
          accessHash: Long.fromString(reference.access_hash),
        };
      case 'channel':
        return {
          _: 'inputPeerChannel',
          channelId: reference.channel_id,
          accessHash: Long.fromString(reference.access_hash),
        };
    }
  }

  public resolveTarget(target: PeerTarget): number | string | tl.TypeInputPeer {
    return 'chat_ref' in target ? this.open(target.chat_ref) : target.chat_id;
  }

  public resolveOptionalTarget(
    peerId: number | string | undefined,
    peerReference: PeerReference | undefined,
  ): number | string | tl.TypeInputPeer {
    if (peerReference) {
      return this.open(peerReference);
    }

    if (peerId !== undefined) {
      return peerId;
    }

    throw new ProtocolError(INVALID_PARAMS, 'A peer ID or reference is required.');
  }

  private serialize(peer: tl.TypeInputPeer): PeerReference {
    switch (peer._) {
      case 'inputPeerChat':
        return { type: 'chat', chat_id: peer.chatId };
      case 'inputPeerUser':
        return { type: 'user', user_id: peer.userId, access_hash: peer.accessHash.toString() };
      case 'inputPeerChannel':
        return { type: 'channel', channel_id: peer.channelId, access_hash: peer.accessHash.toString() };
      default:
        throw new ProtocolError(INVALID_PARAMS, 'This chat cannot be used as a message destination.');
    }
  }
}
