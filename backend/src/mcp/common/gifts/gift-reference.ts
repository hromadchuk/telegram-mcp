import { Long, type InputStarGift } from '@mtcute/core';
import { z } from 'zod';

const peerSchema = z.union([z.number().int(), z.string().trim().min(1)]);

export const giftReferenceSchema = z.union([
  z.object({ message_id: z.number().int().positive() }),
  z.object({ owner: peerSchema, saved_id: z.string().regex(/^\d+$/) }),
  z.object({ slug: z.string().trim().min(1) }),
]);

type GiftReference = z.infer<typeof giftReferenceSchema>;

export function getGiftReference(reference: GiftReference): InputStarGift {
  if ('message_id' in reference) {
    return { message: reference.message_id };
  }

  if ('saved_id' in reference) {
    return {
      owner: reference.owner,
      savedId: Long.fromString(reference.saved_id),
    };
  }

  return reference.slug;
}
