import type { SavedStarGift, StarGift, StarGiftUnique } from '@mtcute/core';

import { serializePeer } from './peer.serializer.js';

export function serializeSavedStarGift(savedGift: SavedStarGift): Record<string, unknown> {
  return {
    savedId: savedGift.savedId?.toString() ?? null,
    messageId: savedGift.messageId,
    giftNum: savedGift.giftNum,
    sender: savedGift.sender ? serializePeer(savedGift.sender) : null,
    date: savedGift.date.toISOString(),
    message: savedGift.message?.text ?? null,
    isVisible: !savedGift.unsaved,
    isPinned: savedGift.pinned,
    isRefunded: savedGift.refunded,
    isNameHidden: savedGift.nameHidden,
    canUpgrade: savedGift.canUpgrade,
    convertStars: savedGift.convertStars?.toString() ?? null,
    upgradeStars: savedGift.upgradeStars?.toString() ?? null,
    transferStars: savedGift.transferStars?.toString() ?? null,
    gift: serializeStarGift(savedGift.gift),
  };
}

export function serializeStarGift(gift: StarGift | StarGiftUnique): Record<string, unknown> {
  if (gift.isUnique) {
    return serializeUniqueStarGift(gift);
  }

  return {
    id: gift.id.toString(),
    isUnique: false,
    title: gift.title,
    isLimited: gift.isLimited,
    isSoldOut: gift.isSoldOut,
    isPremiumOnly: gift.isPremiumOnly,
    purchaseStars: gift.purchaseStars.toString(),
    convertStars: gift.convertStars.toString(),
    upgradeStars: gift.upgradeStars?.toString() ?? null,
    availability: gift.availability
      ? {
          remains: gift.availability.remains,
          total: gift.availability.total,
          resale: gift.availability.resale.toString(),
        }
      : null,
    sticker: {
      fileId: gift.sticker.fileId,
      mimeType: gift.sticker.mimeType,
      width: gift.sticker.width,
      height: gift.sticker.height,
    },
  };
}

function serializeUniqueStarGift(gift: StarGiftUnique): Record<string, unknown> {
  return {
    isUnique: true,
    slug: gift.slug,
    title: gift.title,
    number: gift.num,
    owner: gift.owner ? serializePeer(gift.owner) : null,
    ownerId: gift.ownerId,
    ownerName: gift.ownerName,
    isPremiumOnly: gift.isPremiumOnly,
    isBurned: gift.isBurned,
    isCrafted: gift.isCrafted,
    availability: {
      issued: gift.availabilityIssued,
      total: gift.availabilityTotal,
    },
    resellPriceStars: gift.resellPriceStars?.toString() ?? null,
    resellPriceTon: gift.resellPriceTon?.toString() ?? null,
    model: {
      name: gift.model.name,
      rarityPermille: gift.model.permille,
      rarity: gift.model.rarity,
    },
    pattern: {
      name: gift.pattern.name,
      rarityPermille: gift.pattern.permille,
      rarity: gift.pattern.rarity,
    },
    backdrop: {
      id: gift.backdrop.id,
      name: gift.backdrop.name,
      rarityPermille: gift.backdrop.permille,
      rarity: gift.backdrop.rarity,
    },
  };
}
