import { assembleApplication } from "./assembly.ts";
import { createGateway } from '@mit-sdg/sync-engine/boundary';
import { createHttpHandler } from '@mit-sdg/sync-engine-http/handler';
import { policy } from './edge.ts';
import { serveUploadedImage } from './image-host.ts';

const application = assembleApplication();
const gateway = createGateway({ application });
const handler = createHttpHandler({ application, gateway, policy });
const server = Bun.serve({ hostname: 'localhost', port: 3000, maxRequestBodySize: 8 * 1024 * 1024, async fetch(request) {
  const path = new URL(request.url).pathname;
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
