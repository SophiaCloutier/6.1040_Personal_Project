import { createHttpClient } from '@mit-sdg/sync-engine-http/client';
import type { ClaimedWireHttp } from '../generated/wire.ts';
export const api = createHttpClient<ClaimedWireHttp>({ baseUrl: '/api' });
export function checked<T extends object>(result: T): T {
  if ('error' in result) {
    const code = String(result.error);
    const messages: Record<string, string> = {
      INVALID_OFFER: 'This offer changed or the action belongs to another account. Refresh and try again.',
      CLAIM_UNAVAILABLE: 'This item has already been reserved. Your offer did not reserve it.',
      INVALID_LISTING: 'Check the listing and offer amount. Offers may be disabled, or the listing changed.',
      INVALID_TRANSACTION: 'Check the reservation and attach payment evidence if required. Only its buyer can report payment.',
      INVALID_IMAGE: 'Choose a valid JPEG, PNG, or WebP up to 5 MB.',
      INVALID_MESSAGE: 'Write 1–2000 characters in your own conversation.',
      UNKNOWN_SESSION: 'Your session expired. Sign in again.',
      NETWORK_ERROR: 'Could not connect. Your input is still here; please try again.',
    };
    throw new Error(messages[code] ?? 'Could not complete this request. Refresh and try again.');
  }
  return result;
}
export const errorText = (error: unknown) => error instanceof Error ? error.message : 'Could not connect. Please try again.';
export function fileData(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Could not read this image. Choose another file.')); reader.readAsDataURL(file);
  });
}
