import { S3Client } from 'bun';

export function imageStorage() {
  if (process.env.S3_BUCKET) return new S3Client();
  if (process.env.NODE_ENV === 'production') throw new Error('S3 storage must be configured in production.');
  return null;
}
