import { expect, test } from 'bun:test';
import { MongoClient } from 'mongodb';
import sharp from 'sharp';
import { createGateway } from '@mit-sdg/sync-engine/boundary';
import { createHttpHandler } from '@mit-sdg/sync-engine-http/handler';
import { assembleApplication } from '../src/assembly.ts';
import { policy } from '../src/edge.ts';

test('beta journey: edits, competing offers, frozen terms, private evidence and conversations', async () => {
  const database = `claimed_beta_${crypto.randomUUID().replaceAll('-', '')}`;
  process.env.MONGODB_DATABASE = database;
  const admin = new MongoClient(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017');
  const application = assembleApplication();
  const handler = createHttpHandler({ application, gateway: createGateway({ application }), policy });
  async function call(path: string, body: object = {}, cookie = '') {
    const response = await handler(new Request(`http://localhost:3000/api${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000', Cookie: cookie }, body: JSON.stringify(body) }));
    return { status: response.status, body: await response.json() as any, cookie: response.headers.get('set-cookie')?.split(';')[0] ?? '' };
  }
  try {
    const seller = await call('/auth/register', { username: 'beta_seller', password: 'seller-password' });
    const buyer = await call('/auth/register', { username: 'beta_buyer', password: 'buyer-password' });
    const rival = await call('/auth/register', { username: 'beta_rival', password: 'rival-password' });
    const outsider = await call('/auth/register', { username: 'beta_outsider', password: 'outsider-password' });
    expect([seller.status, buyer.status, rival.status, outsider.status]).toEqual([200, 200, 200, 200]);
    const image = '/uploads/12345678-1234-1234-1234-123456789abc.webp';
    const details = { title: 'Beta chair', description: 'A sturdy chair', price: 100, category: 'Furniture', pickup: 'Lobby', payment: 'Venmo beta-seller', images: [image], obo: true, requireProof: true, imagePositions: { [image]: { x: 20, y: 80, zoom: 2 } } };
    const published = await call('/marketplace/publish', { details: JSON.stringify(details) }, seller.cookie);
    expect(published.status).toBe(200); const listing = published.body.listing;
    const saved = (await call('/marketplace/activity', {}, seller.cookie)).body.marketplace.listings.find((i: any) => i.listing === listing).details;
    expect(JSON.parse(saved).imagePositions[image]).toEqual({ x: 20, y: 80, zoom: 2 });
    expect((await call('/marketplace/edit', { listing, previous: saved, details: saved }, buyer.cookie)).status).toBe(400);
    expect((await call('/marketplace/edit', { listing, previous: saved, details: JSON.stringify({ ...details, imagePositions: { [image]: { x: 101, y: 50 } } }) }, seller.cookie)).status).toBe(400);
    for (const zoom of [0.9, 4.1, '2']) {
      expect((await call('/marketplace/edit', { listing, previous: saved, details: JSON.stringify({ ...details, imagePositions: { [image]: { x: 50, y: 50, zoom } } }) }, seller.cookie)).status).toBe(400);
    }
    const edited = JSON.stringify({ ...details, price: 110, tags: ['armchair', 'chair'], description: 'Updated condition and dimensions' });
    expect((await call('/marketplace/edit', { listing, previous: saved, details: edited }, seller.cookie)).status).toBe(200);
    const editedRow = (await call('/marketplace/activity', {}, seller.cookie)).body.marketplace.listings.find((item: any) => item.listing === listing);
    expect(JSON.parse(editedRow.details).tags).toEqual(['armchair', 'chair']);
    expect(JSON.parse(editedRow.details).description).toBe('Updated condition and dimensions');
    expect((await call('/marketplace/edit', { listing, previous: saved, details: edited }, seller.cookie)).status).toBe(400);
    const buyerView = (await call('/marketplace/activity', {}, buyer.cookie)).body.marketplace.listings.find((i: any) => i.listing === listing);
    expect(JSON.parse(buyerView.details).payment).toBeUndefined();
    expect((await call('/marketplace/offer', { listing, amount: '0' }, buyer.cookie)).status).toBe(400);
    expect((await call('/marketplace/offer', { listing, amount: '40.001' }, buyer.cookie)).status).toBe(400);
    expect((await call('/marketplace/offer', { listing, amount: '40' }, seller.cookie)).status).toBe(400);
    const offer1 = await call('/marketplace/offer', { listing, amount: '70' }, buyer.cookie);
    const offer2 = await call('/marketplace/offer', { listing, amount: '80' }, rival.cookie);
    expect([offer1.status, offer2.status]).toEqual([200, 200]);
    for (const cookie of ['', outsider.cookie, buyer.cookie, seller.cookie]) {
      const visible = await call('/marketplace/listing-offers', { listing }, cookie);
      expect(visible.status).toBe(200);
      expect(visible.body.inbox.offers.map((o: any) => JSON.parse(o.terms))).toEqual([{ price: 70 }, { price: 80 }]);
      expect(visible.body.inbox.offers.map((o: any) => o.offer)).toEqual([offer1.body.offer, offer2.body.offer]);
    }
    expect((await call('/marketplace/listing-offers', { listing: 'another-listing' })).body.inbox.offers).toEqual([]);
    expect((await call('/marketplace/resolve-offer', { offer: offer1.body.offer, decision: 'withdrawn' }, outsider.cookie)).status).toBe(403);
    expect((await call('/marketplace/offers')).status).toBe(401);
    expect((await call('/marketplace/offers', {}, outsider.cookie)).body.inbox.offers).toEqual([]);
    expect((await call('/marketplace/accept-offer', { offer: offer1.body.offer }, buyer.cookie)).status).toBe(403);
    const competition = await Promise.all([call('/marketplace/accept-offer', { offer: offer1.body.offer }, seller.cookie), call('/marketplace/accept-offer', { offer: offer2.body.offer }, seller.cookie)]);
    expect(competition.map(r => r.status).sort()).toEqual([200, 409]);
    const winner = competition[0].status === 200 ? buyer : rival;
    const loser = competition[0].status === 200 ? rival : buyer;
    const agreed = competition[0].status === 200 ? 70 : 80;
    const inbox = (await call('/marketplace/offers', {}, seller.cookie)).body.inbox.offers;
    expect(inbox.map((o: any) => o.status).sort()).toEqual(['accepted', 'superseded']);
    const frozen = (await call('/marketplace/payment', { listing }, winner.cookie)).body.transaction.payment;
    expect(JSON.parse(frozen.terms).price).toBe(agreed);
    expect(JSON.parse(frozen.terms).requireProof).toBe(true);
    expect((await call('/marketplace/payment', { listing }, loser.cookie)).body.transaction.payment.terms).toBeNull();
    expect((await call('/marketplace/payment', { listing }, loser.cookie)).body.transaction.payment.details).toBeNull();
    expect((await call('/marketplace/offer', { listing, amount: '90' }, loser.cookie)).status).toBe(409);
    const latest = (await call('/marketplace/activity', {}, seller.cookie)).body.marketplace.listings.find((i: any) => i.listing === listing).details;
    expect((await call('/marketplace/edit', { listing, previous: latest, details: JSON.stringify({ ...details, price: 250, requireProof: false, payment: 'New instructions' }) }, seller.cookie)).status).toBe(200);
    const stillFrozen = JSON.parse((await call('/marketplace/payment', { listing }, winner.cookie)).body.transaction.payment.terms);
    expect(stillFrozen.price).toBe(agreed); expect(stillFrozen.payment).toBe('Venmo beta-seller'); expect(stillFrozen.requireProof).toBe(true);
    expect((await call('/marketplace/report-paid', { listing }, winner.cookie)).status).toBe(403);
    expect((await call('/marketplace/report-evidence', { listing, data: '', mime: '' }, winner.cookie)).status).toBe(403);
    expect((await call('/marketplace/report-evidence', { listing, data: 'aGVsbG8=', mime: 'image/png' }, winner.cookie)).status).toBe(400);
    const screenshot = (await sharp({ create: { width: 8, height: 8, channels: 3, background: '#ffffff' } }).png().toBuffer()).toString('base64');
    expect((await call('/marketplace/report-evidence', { listing, data: screenshot, mime: 'image/png' }, loser.cookie)).status).toBe(403);
    expect((await call('/marketplace/report-evidence', { listing, data: screenshot, mime: 'image/png' }, winner.cookie)).status).toBe(200);
    const paidDetails = (await call('/marketplace/activity', {}, seller.cookie)).body.marketplace.listings.find((item: any) => item.listing === listing).details;
    expect((await call('/marketplace/edit', { listing, previous: paidDetails, details: JSON.stringify({ ...JSON.parse(paidDetails), price: 999 }) }, seller.cookie)).status).toBe(409);
    const privateImage = (await call('/marketplace/payment', { listing }, seller.cookie)).body.transaction.payment.evidence;
    expect(privateImage.startsWith('data:image/webp;base64,')).toBe(true);
    expect((await call('/marketplace/payment', { listing }, outsider.cookie)).body.transaction.payment.evidence).toBeNull();
    expect(JSON.stringify((await call('/marketplace/list')).body)).not.toContain('data:image');
    expect((await call('/marketplace/cancel', { listing }, seller.cookie)).status).toBe(403);
    expect((await call('/marketplace/confirm', { listing }, winner.cookie)).status).toBe(403);
    expect((await call('/marketplace/confirm', { listing }, seller.cookie)).status).toBe(200);
    expect((await call('/marketplace/edit', { listing, previous: paidDetails, details: paidDetails }, seller.cookie)).status).toBe(409);
    expect((await call('/marketplace/list')).body.marketplace.listings).toEqual([]);
    // Conversations continue after a sale so pickup can be arranged.
    const winnerName = competition[0].status === 200 ? 'beta_buyer' : 'beta_rival';
    expect((await call('/messages/send', { listing, buyer: winnerName, text: 'Can we meet at 5?' }, winner.cookie)).status).toBe(200);
    expect((await call('/messages/send', { listing, buyer: winnerName, text: 'Yes, in the lobby.' }, seller.cookie)).status).toBe(200);
    expect((await call('/messages/send', { listing, buyer: winnerName, text: 'Impersonation' }, outsider.cookie)).status).toBe(403);
    expect((await call('/messages/send', { listing, buyer: 'unrelated', text: 'Unsolicited reply' }, seller.cookie)).status).toBe(403);
    expect((await call('/messages/send', { listing, buyer: winnerName, text: '   ' }, winner.cookie)).status).toBe(400);
    expect((await call('/messages/list')).status).toBe(401);
    expect((await call('/messages/list', {}, outsider.cookie)).body.inbox.messages).toEqual([]);
    const secondBuyer = competition[0].status === 200 ? 'beta_rival' : 'beta_buyer';
    expect((await call('/messages/send', { listing, buyer: secondBuyer, text: 'Is there another chair?' }, loser.cookie)).status).toBe(200);
    const summaries = (await call('/messages/conversations', {}, seller.cookie)).body.inbox.conversations;
    expect(summaries.map((row: any) => row.buyer)).toEqual([secondBuyer, winnerName]);
    expect((await call('/messages/thread', { listing, buyer: winnerName }, seller.cookie)).body.conversation.messages.map((row: any) => row.text)).toEqual(['Can we meet at 5?', 'Yes, in the lobby.']);
    expect((await call('/messages/thread', { listing, buyer: secondBuyer }, seller.cookie)).body.conversation.messages.map((row: any) => row.text)).toEqual(['Is there another chair?']);
    expect((await call('/messages/thread', { listing, buyer: winnerName }, loser.cookie)).body.conversation.messages).toEqual([]);
    expect((await call('/messages/conversations', {}, outsider.cookie)).body.inbox.conversations).toEqual([]);
    expect((await call('/messages/thread', { listing, buyer: winnerName })).status).toBe(401);
    expect((await call('/messages/history', { listing, buyer: winnerName, before: '' }, winner.cookie)).body.conversation.messages).toHaveLength(2);
    expect((await call('/messages/history', { listing, buyer: winnerName, before: '' }, outsider.cookie)).body.conversation.messages).toEqual([]);
    expect((await call('/messages/history', { listing, buyer: winnerName, before: '' })).status).toBe(401);
    const messages = (await call('/messages/list', {}, winner.cookie)).body.inbox.messages;
    expect(messages.map((m: any) => m.text)).toEqual(['Can we meet at 5?', 'Yes, in the lobby.']);
    // Reconstruct the application to verify that conversations and receipts persist.
    const reconstructed = assembleApplication();
    const handler2 = createHttpHandler({ application: reconstructed, gateway: createGateway({ application: reconstructed }), policy });
    const persisted = await handler2(new Request('http://localhost:3000/api/messages/list', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000', Cookie: winner.cookie }, body: '{}' }));
    expect((await persisted.json() as any).inbox.messages).toHaveLength(2);
  } finally { await admin.db(database).dropDatabase(); await admin.close(); }
}, 30000);

test('offers may be declined or withdrawn; full-price reservations supersede proposals', async () => {
  process.env.MONGODB_DATABASE = `claimed_offers_${crypto.randomUUID().replaceAll('-', '')}`;
  const admin = new MongoClient(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017');
  const app = assembleApplication(), handler = createHttpHandler({ application: app, gateway: createGateway({ application: app }), policy });
  async function call(path: string, body: object = {}, cookie = '') {
    const response = await handler(new Request(`http://localhost:3000/api${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000', Cookie: cookie }, body: JSON.stringify(body) }));
    return { status: response.status, body: await response.json() as any, cookie: response.headers.get('set-cookie')?.split(';')[0] ?? '' };
  }
  try {
    const seller = await call('/auth/register', { username: 'offer_seller', password: 'seller-password' });
    const buyer = await call('/auth/register', { username: 'offer_buyer', password: 'buyer-password' });
    const published = await call('/marketplace/publish', { details: JSON.stringify({ title: 'Lamp', description: '', price: 15, pickup: 'Lobby', payment: 'Cash', obo: true }) }, seller.cookie);
    const listing = published.body.listing;
    for (const decision of ['declined', 'withdrawn']) {
      const offered = await call('/marketplace/offer', { listing, amount: '10' }, buyer.cookie);
      expect((await call('/marketplace/resolve-offer', { offer: offered.body.offer, decision }, decision === 'declined' ? buyer.cookie : seller.cookie)).status).toBe(403);
      expect((await call('/marketplace/resolve-offer', { offer: offered.body.offer, decision }, decision === 'declined' ? seller.cookie : buyer.cookie)).status).toBe(200);
      expect((await call('/marketplace/accept-offer', { offer: offered.body.offer }, seller.cookie)).status).toBe(403);
    }
    const offered = await call('/marketplace/offer', { listing, amount: '12' }, buyer.cookie);
    const race = await Promise.all([call('/marketplace/claim', { listing }, buyer.cookie), call('/marketplace/accept-offer', { offer: offered.body.offer }, seller.cookie)]);
    expect(race.map(r => r.status).sort()).toEqual([200, 409]);
    expect((await call('/marketplace/report-evidence', { listing, data: '', mime: '' }, buyer.cookie)).status).toBe(200);
  } finally { await admin.db(process.env.MONGODB_DATABASE).dropDatabase(); await admin.close(); }
}, 30000);


test('legacy reservations retain participant-only payment instructions', async () => {
  process.env.MONGODB_DATABASE = `claimed_legacy_${crypto.randomUUID().replaceAll('-', '')}`;
  const admin = new MongoClient(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017');
  const app = assembleApplication(), handler = createHttpHandler({ application: app, gateway: createGateway({ application: app }), policy });
  async function call(path: string, body: object = {}, cookie = '') {
    const response = await handler(new Request(`http://localhost:3000/api${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000', Cookie: cookie }, body: JSON.stringify(body) }));
    return { status: response.status, body: await response.json() as any, cookie: response.headers.get('set-cookie')?.split(';')[0] ?? '' };
  }
  try {
    const seller = await call('/auth/register', { username: 'legacy_seller', password: 'seller-password' });
    const buyer = await call('/auth/register', { username: 'legacy_buyer', password: 'buyer-password' });
    const outsider = await call('/auth/register', { username: 'legacy_other', password: 'other-password' });
    const published = await call('/marketplace/publish', { details: JSON.stringify({ title: 'Old lamp', description: '', price: 15, pickup: 'Lobby', payment: 'Legacy payment instructions' }) }, seller.cookie);
    const listing = published.body.listing;
    expect((await call('/marketplace/offer', { listing, amount: '10' }, buyer.cookie)).status).toBe(400);
    // Recreate the old journey using concept actions, without editing database state.
    const { ClaimingConcept } = await import('../src/concepts/Claiming.ts');
    const { TransactionConfirmingConcept } = await import('../src/concepts/TransactionConfirming.ts');
    await new ClaimingConcept().claim({ resource: listing, claimer: 'legacy_buyer' });
    await new TransactionConfirmingConcept().start({ subject: listing, payer: 'legacy_buyer', payee: 'legacy_seller' });
    const payment = (await call('/marketplace/payment', { listing }, buyer.cookie)).body.transaction.payment;
    expect(payment.terms).toBe('{}'); expect(JSON.parse(payment.details).payment).toBe('Legacy payment instructions');
    expect((await call('/marketplace/payment', { listing }, outsider.cookie)).body.transaction.payment.details).toBeNull();
    expect((await call('/marketplace/report-paid', { listing }, buyer.cookie)).status).toBe(200);
  } finally { await admin.db(process.env.MONGODB_DATABASE).dropDatabase(); await admin.close(); }
}, 30000);
