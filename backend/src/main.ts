import { database } from './database.ts';
import { imageStorage } from './image-storage.ts';
import { assembleApplication } from "./assembly.ts";
import { createGateway } from '@mit-sdg/sync-engine/boundary';
import { createHttpHandler } from '@mit-sdg/sync-engine-http/handler';
import { policy } from './edge.ts';
import { serveUploadedImage } from './image-host.ts';

if (process.env.NODE_ENV === 'production' && (!process.env.MONGODB_URI || !process.env.PUBLIC_ORIGIN)) throw new Error('Production requires MONGODB_URI and PUBLIC_ORIGIN.');
imageStorage();
const application = assembleApplication();
const gateway = createGateway({ application });
const handler = createHttpHandler({ application, gateway, policy });
const server = Bun.serve({ hostname: '0.0.0.0', port: Number(process.env.PORT ?? 3000), maxRequestBodySize: 8 * 1024 * 1024, async fetch(request) {
  const path = new URL(request.url).pathname;
  if (path === '/health' && request.method === 'GET') {
    try {
      await database().command({ ping: 1 });
      if (!(await Bun.file(new URL('../web-dist/index.html', import.meta.url)).exists())) return Response.json({ ok: false }, { status: 503 });
      return Response.json({ ok: true });
    } catch { return Response.json({ ok: false }, { status: 503 }); }
  }
  if (path.startsWith('/api/')) return handler(request);
  if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });
  const imageResponse = await serveUploadedImage(path);
  if (imageResponse) return imageResponse;
  const isPage = path === '/' || path === '/activity' || /^\/items\/[a-f0-9-]{36}$/.test(path);
  if (!isPage && !/^\/assets\/[A-Za-z0-9._-]+$/.test(path)) return new Response('Not found', { status: 404 });
  const file = Bun.file(new URL(`../web-dist${isPage ? '/index.html' : path}`, import.meta.url));
  return await file.exists() ? new Response(file) : new Response('Run bun run build first.', { status: 503 });
} });
console.log(`Claimed API listening on ${server.url}`);
