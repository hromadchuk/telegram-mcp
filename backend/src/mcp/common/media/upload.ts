import type { InputFileLike } from '@mtcute/core';
import { z } from 'zod';

import { MAX_INLINE_MEDIA_BYTES } from './media.constants.js';

const base64Schema = z
  .string()
  .min(1)
  .refine(isValidBase64, { message: 'File contents must be valid base64.' })
  .refine((value) => Buffer.from(value, 'base64').length <= MAX_INLINE_MEDIA_BYTES, {
    message: 'Inline files cannot exceed 3 MB. Use an HTTPS URL or Telegram file ID for larger files.',
  });

export const mediaSourceSchema = z
  .object({
    url: z.url().optional().describe('Public HTTPS URL of the file.'),
    file_id: z.string().trim().min(1).optional().describe('Reusable Telegram file ID.'),
    base64: base64Schema.optional().describe('Base64-encoded file contents up to 3 MB.'),
    file_name: z.string().trim().min(1).optional(),
    mime_type: z.string().trim().min(1).optional(),
  })
  .refine((source) => [source.url, source.file_id, source.base64].filter(Boolean).length === 1, {
    message: 'Provide exactly one of url, file_id, or base64.',
  });

export type MediaSource = z.infer<typeof mediaSourceSchema>;

function isValidBase64(value: string): boolean {
  return value.length % 4 === 0 && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value);
}

export function toInputFile(source: MediaSource): InputFileLike {
  if (source.url) {
    return new URL(source.url);
  }

  if (source.file_id) {
    return source.file_id;
  }

  return Buffer.from(source.base64!, 'base64');
}
