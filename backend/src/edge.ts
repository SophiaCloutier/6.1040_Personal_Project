import { httpPolicy } from '@mit-sdg/sync-engine-http/policy';
export const policy = httpPolicy({
  publicOrigin: process.env.PUBLIC_ORIGIN ?? 'http://localhost:3000', basePath: '/api',
  limits: { requestBodyBytes: 8 * 1024 * 1024 },
  publicErrors: { LISTING_LOCKED: 'CONFLICT', INVALID_MESSAGE: 'FORBIDDEN', INVALID_OFFER: 'FORBIDDEN', INVALID_USERNAME: 'INVALID_REQUEST', WEAK_PASSWORD: 'INVALID_REQUEST', USERNAME_TAKEN: 'CONFLICT', INVALID_CREDENTIALS: 'UNAUTHORIZED', UNKNOWN_SESSION: 'UNAUTHORIZED', INVALID_IMAGE: 'INVALID_REQUEST', INVALID_LISTING: 'INVALID_REQUEST', CLAIM_UNAVAILABLE: 'CONFLICT', INVALID_TRANSACTION: 'FORBIDDEN', CANNOT_BUY: 'FORBIDDEN', CANCELLATION_UNAVAILABLE: 'FORBIDDEN' },
  cookies: { session: { name: 'claimed-session', input: 'session', issue: [
    { path: '/auth/register', value: 'session', expires: 'expiresAt' },
    { path: '/auth/sign-in', value: 'session', expires: 'expiresAt' },
  ], clear: ['/auth/sign-out'] } },
});

