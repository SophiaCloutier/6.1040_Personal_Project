// @ts-ignore
import { expect, test } from 'bun:test';
import { mkdtemp, readFile, readdir, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { MongoClient } from 'mongodb';
import { createGateway } from '@mit-sdg/sync-engine/boundary';
import { createHttpHandler } from '@mit-sdg/sync-engine-http/handler';
import { ImageUploadingConcept, InvalidImage } from '../src/concepts/ImageUploading.ts';
import { assembleApplication } from '../src/assembly.ts';
import { policy } from '../src/edge.ts';
import { serveUploadedImage } from '../src/image-host.ts';
import { randomBytes } from 'node:crypto';

test('photo uploads validate content, resize, persist, and require authentication', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'claimed-images-'));
  const priorDirectory = process.env.UPLOAD_DIRECTORY;
  process.env.UPLOAD_DIRECTORY = directory;
  const database = `claimed_test_${crypto.randomUUID().replaceAll('-', '')}`;
  process.env.MONGODB_DATABASE = database;
  const admin = new MongoClient('mongodb://127.0.0.1:27017');
  try {
    const images = new ImageUploadingConcept();
    const photo = await sharp({ create: { width: 2400, height: 1200, channels: 3, background: '#334155' } }).png().toBuffer();
    await expect(images.store({ data: Buffer.from('not a picture').toString('base64'), mime: 'image/png' })).rejects.toBeInstanceOf(InvalidImage);
    await expect(images.store({ data: photo.toString('base64'), mime: 'image/jpeg' })).rejects.toBeInstanceOf(InvalidImage);
    await expect(images.store({ data: photo.toString('base64'), mime: 'image/svg+xml' })).rejects.toBeInstanceOf(InvalidImage);
    await expect(images.store({ data: Buffer.alloc(5 * 1024 * 1024 + 1).toString('base64'), mime: 'image/png' })).rejects.toBeInstanceOf(InvalidImage);
    const application = assembleApplication();
    const handler = createHttpHandler({ application, gateway: createGateway({ application }), policy });
    async function call(path: string, body: object, cookie = '') {
      return handler(new Request('http://localhost:3000/api' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000', Cookie: cookie }, body: JSON.stringify(body) }));
    }
    const payload = { data: photo.toString('base64'), mime: 'image/png' };
    expect((await call('/images/upload', payload)).status).toBe(401);
    const registered = await call('/auth/register', { username: 'photographer', password: 'photo-test-password' });
    const cookie = registered.headers.get('set-cookie')!.split(';')[0];
    const response = await call('/images/upload', payload, cookie);
    expect(response.status).toBe(200);
    const { image } = await response.json() as { image: string };
    expect(image).toMatch(/^\/uploads\/[a-f0-9-]{36}\.webp$/);
    const stored = await readFile(join(directory, image.split('/').at(-1)!));
    const metadata = await sharp(stored).metadata();
    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBe(1600);
    expect(metadata.height).toBe(800);
    const served = await serveUploadedImage(image);
    expect(served?.headers.get('Content-Type')).toBe('image/webp');
    expect(Buffer.from(await served!.arrayBuffer())).toEqual(stored);
    expect(await serveUploadedImage('/uploads/../package.json')).toBeNull();
    const largePhoto = await sharp(randomBytes(1024 * 1024 * 3), { raw: { width: 1024, height: 1024, channels: 3 } }).png().toBuffer();
    expect(largePhoto.length).toBeGreaterThan(1024 * 1024);
    expect((await call('/images/upload', { data: largePhoto.toString('base64'), mime: 'image/png' }, cookie)).status).toBe(200);
    const published = await call('/marketplace/publish', { details: JSON.stringify({ title: 'Uploaded photo item', description: '', category: 'Other', price: 5, pickup: 'MIT', payment: 'External', image }) }, cookie);
    expect(published.status).toBe(200);
    const listingPage = await call('/marketplace/activity', {}, cookie);
    const result = await listingPage.json() as any;
    expect(JSON.parse(result.marketplace.listings[0].details).image).toBe(image);
  } finally {
    await admin.db(database).dropDatabase(); await admin.close();
    for (const file of await readdir(directory)) await unlink(join(directory, file));
    await rmdir(directory);
    if (priorDirectory === undefined) delete process.env.UPLOAD_DIRECTORY; else process.env.UPLOAD_DIRECTORY = priorDirectory;
  }
}, 30000);

