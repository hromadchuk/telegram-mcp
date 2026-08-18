import type { MessageMedia } from '@mtcute/core';

export function serializeMedia(media: MessageMedia): Record<string, unknown> | null {
  if (!media) {
    return null;
  }

  const result: Record<string, unknown> = { type: media.type };

  if (media.type === 'photo') {
    result.mimeType = 'image/jpeg';
  }

  if ('fileId' in media) {
    result.fileId = media.fileId;
  }

  if ('fileName' in media) {
    result.fileName = media.fileName;
  }

  if ('mimeType' in media) {
    result.mimeType = media.mimeType;
  }

  if ('fileSize' in media) {
    result.fileSize = media.fileSize ?? null;
  }

  if ('width' in media) {
    result.width = media.width;
  }

  if ('height' in media) {
    result.height = media.height;
  }

  if ('duration' in media) {
    result.duration = media.duration;
  }

  return result;
}
