import { expect, test } from 'bun:test';
import { MongoClient } from 'mongodb';
import { createGateway } from '@mit-sdg/sync-engine/boundary';
import { createHttpHandler } from '@mit-sdg/sync-engine-http/handler';
import { assembleApplication } from '../src/assembly.ts';
import { policy } from '../src/edge.ts';

test('only sellers can remove available listings; removal and reservation are exclusive', async () => {
  const name = `claimed_removal_${crypto.randomUUID().replaceAll('-', '')}`;
  process.env.MONGODB_DATABASE = name;
  const admin = new MongoClient(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017', { serverSelectionTimeoutMS: 2000 });
  await admin.connect();
  const app = assembleApplication();
  const handler = createHttpHandler({ application: app, gateway: createGateway({ application: app }), policy });
  async function call(path: string, body: object = {}, cookie = '') {
    const response = await handler(new Request(`http://localhost:3000/api${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000', Cookie: cookie }, body: JSON.stringify(body),
    }));
    return { status: response.status, body: await response.json() as any, cookie: response.headers.get('set-cookie')?.split(';')[0] ?? '' };
  }
  try {
    const seller = await call('/auth/register', { username: 'removal_seller', password: 'seller-password' });
    const buyer = await call('/auth/register', { username: 'removal_buyer', password: 'buyer-password' });
    const publish = async () => (await call('/marketplace/publish', { details: JSON.stringify({ title: 'Chair', price: 25, description: '', pickup: 'Lobby', payment: 'Venmo seller', obo: true }) }, seller.cookie)).body.listing;
    const listing = await publish();
    const offer = await call('/marketplace/offer', { listing, amount: '20' }, buyer.cookie);
    expect((await call('/marketplace/remove', { listing })).status).toBe(401);
    expect((await call('/marketplace/remove', { listing }, buyer.cookie)).status).toBe(400);
    expect((await call('/marketplace/remove', { listing }, seller.cookie)).status).toBe(200);
    for (const [path, cookie] of [['/marketplace/list', ''], ['/marketplace/activity', seller.cookie], ['/marketplace/activity', buyer.cookie]]) {
      expect((await call(path, {}, cookie)).body.marketplace.listings.some((row: any) => row.listing === listing)).toBe(false);
    }
    expect((await call('/marketplace/claim', { listing }, buyer.cookie)).status).toBe(409);
    expect((await call('/marketplace/offer', { listing, amount: '21' }, buyer.cookie)).status).toBe(409);
    expect((await call('/marketplace/accept-offer', { offer: offer.body.offer }, seller.cookie)).status).toBe(409);
    expect((await call('/marketplace/remove', { listing }, seller.cookie)).status).toBe(409);

    const reserved = await publish();
    expect((await call('/marketplace/claim', { listing: reserved }, buyer.cookie)).status).toBe(200);
    expect((await call('/marketplace/remove', { listing: reserved }, seller.cookie)).status).toBe(409);
    await call('/marketplace/report-paid', { listing: reserved }, buyer.cookie);
    await call('/marketplace/confirm', { listing: reserved }, seller.cookie);
    expect((await call('/marketplace/remove', { listing: reserved }, seller.cookie)).status).toBe(409);

    const contested = await publish();
    const race = await Promise.all([
      call('/marketplace/remove', { listing: contested }, seller.cookie),
      call('/marketplace/claim', { listing: contested }, buyer.cookie),
    ]);
    expect(race.map(result => result.status).sort()).toEqual([200, 409]);
    const state = await admin.db(name).collection('claims').findOne({ resource: contested });
    expect(state?.status).toBe(race[0].status === 200 ? 'removed' : 'claimed');
  } finally {
    await admin.db(name).dropDatabase();
    await admin.close();
  }
}, 30000);
