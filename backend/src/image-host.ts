import { resolve } from 'node:path';
import { uploadDirectory } from './concepts/ImageUploading.ts';

export async function serveUploadedImage(path: string): Promise<Response | null> {
  if (!/^\/uploads\/[a-f0-9-]{36}\.webp$/.test(path)) return null;
  const file = Bun.file(resolve(uploadDirectory(), path.slice('/uploads/'.length)));
  return await file.exists() ? new Response(file, { headers: { 'Content-Type': 'image/webp', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=31536000, immutable' } }) : new Response('Image not found', { status: 404 });
}
