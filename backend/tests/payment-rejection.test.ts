import { expect, test } from 'bun:test';
import { MongoClient } from 'mongodb';
import sharp from 'sharp';
import { createGateway } from '@mit-sdg/sync-engine/boundary';
import { createHttpHandler } from '@mit-sdg/sync-engine-http/handler';
import { assembleApplication } from '../src/assembly.ts';
import { policy } from '../src/edge.ts';

test('seller rejects payment for retry or relisting; authorization and competing confirmation are enforced', async () => {
  const database = `claimed_rejection_${crypto.randomUUID().replaceAll('-', '')}`;
  process.env.MONGODB_DATABASE = database;
  const admin = new MongoClient(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017');
  const application = assembleApplication();
  const handler = createHttpHandler({ application, gateway: createGateway({ application }), policy });
  async function call(path: string, body: object = {}, cookie = '') {
    const response = await handler(new Request(`http://localhost:3000/api${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000', Cookie: cookie }, body: JSON.stringify(body) }));
    return { status: response.status, body: await response.json() as any, cookie: response.headers.get('set-cookie')?.split(';')[0] ?? '' };
  }
  try {
    const seller = await call('/auth/register', { username: 'reject_seller', password: 'seller-password' });
    const buyer = await call('/auth/register', { username: 'reject_buyer', password: 'buyer-password' });
    const other = await call('/auth/register', { username: 'reject_other', password: 'other-password' });
    const details = JSON.stringify({ title: 'Chair', description: '', price: 20, pickup: 'Lobby', payment: 'Venmo seller', requireProof: true });
    const listing = (await call('/marketplace/publish', { details }, seller.cookie)).body.listing;
    expect((await call('/marketplace/claim', { listing }, buyer.cookie)).status).toBe(200);
    const data = (await sharp({ create: { width: 8, height: 8, channels: 3, background: '#fff' } }).png().toBuffer()).toString('base64');
    const report = () => call('/marketplace/report-evidence', { listing, data, mime: 'image/png' }, buyer.cookie);
    const reject = (decision: string, cookie = seller.cookie) => call('/marketplace/reject-payment', { listing, decision }, cookie);
    const state = async () => (await call('/marketplace/activity', {}, seller.cookie)).body.marketplace.listings.find((i: any) => i.listing === listing);
    expect((await reject('retry')).status).toBe(403);
    expect((await report()).status).toBe(200);
    for (const cookie of [buyer.cookie, other.cookie, '']) expect((await reject('relist', cookie)).status).not.toBe(200);
    expect((await reject('invalid')).status).not.toBe(200);
    expect((await reject('retry')).status).toBe(200);
    expect((await state()).transaction.status).toBe('paymentRejected');
    expect((await state()).claim.claimer).toBe('reject_buyer');
    const payment = (await call('/marketplace/payment', { listing }, buyer.cookie)).body.transaction.payment;
    expect(payment.evidence).toBe(''); expect(JSON.parse(payment.terms).price).toBe(20); expect(JSON.parse(payment.terms).requireProof).toBe(true);
    expect((await call('/marketplace/report-paid', { listing }, buyer.cookie)).status).toBe(403);
    expect((await call('/marketplace/confirm', { listing }, seller.cookie)).status).toBe(403);
    expect((await report()).status).toBe(200);
    expect((await reject('relist')).status).toBe(200);
    expect((await state()).claim.status).toBe('available');
    expect((await call('/marketplace/payment', { listing }, buyer.cookie)).body.transaction.payment.evidence).toBeNull();
    const saved = (await state()).details;
    expect((await call('/marketplace/edit', { listing, previous: saved, details: saved }, seller.cookie)).status).toBe(200);
    expect((await call('/marketplace/claim', { listing }, buyer.cookie)).status).toBe(200);
    expect((await report()).status).toBe(200);
    const results = await Promise.all([reject('relist'), call('/marketplace/confirm', { listing }, seller.cookie)]);
    expect(results.filter(r => r.status === 200)).toHaveLength(1);
    const final = await state();
    expect(['available', 'completed']).toContain(final.claim.status);
  } finally { await admin.db(database).dropDatabase(); await admin.close(); }
});
