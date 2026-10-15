import { afterAll, expect, test } from 'bun:test';
import { MongoClient } from 'mongodb';
import { ListingConcept, InvalidListing } from '../src/concepts/Listing.ts';
import { ClaimingConcept, ClaimUnavailable } from '../src/concepts/Claiming.ts';
import { TransactionConfirmingConcept, InvalidTransaction, CancellationUnavailable } from '../src/concepts/TransactionConfirming.ts';
const name = `claimed_test_${crypto.randomUUID().replaceAll('-', '')}`;
process.env.MONGODB_DATABASE = name;
const admin = new MongoClient('mongodb://127.0.0.1:27017');
afterAll(async () => { await admin.db(name).dropDatabase(); await admin.close(); });

test('Listing validates prices and fields and preserves seller identity', async () => {
  const listings = new ListingConcept();
  const value = { title: 'Lamp', price: 10, description: 'A desk lamp', category: 'Other', pickup: 'Dorm lobby', payment: 'External payment', image: '' };
  for (const update of [{ price: -1 }, { title: '' }, { pickup: '' }, { image: 'javascript:alert(1)' }]) {
    await expect(listings.create({ seller: 'seller', details: JSON.stringify({ ...value, ...update }) })).rejects.toBeInstanceOf(InvalidListing);
  }
  const { listing } = await listings.create({ seller: 'seller', details: JSON.stringify(value) });
  expect(JSON.parse((await listings._get({ listing }))[0].details).images).toEqual([]);
  const imageUrls = Array.from({ length: 5 }, (_, n) => `https://example.com/item-${n}.jpg`);
  const gallery = await listings.create({ seller: 'seller', details: JSON.stringify({ ...value, images: imageUrls }) });
  const galleryDetails = JSON.parse((await listings._get({ listing: gallery.listing }))[0].details);
  expect(galleryDetails.images).toEqual(imageUrls);
  expect(galleryDetails.image).toBe(imageUrls[0]);
  await expect(listings.create({ seller: 'seller', details: JSON.stringify({ ...value, images: [...imageUrls, 'https://example.com/six.jpg'] }) })).rejects.toBeInstanceOf(InvalidListing);
  await expect(listings.create({ seller: 'seller', details: JSON.stringify({ ...value, images: ['javascript:alert(1)'] }) })).rejects.toBeInstanceOf(InvalidListing);
  const legacy = await listings.create({ seller: 'seller', details: JSON.stringify({ ...value, image: imageUrls[0] }) });
  expect(JSON.parse((await listings._get({ listing: legacy.listing }))[0].details).images).toEqual([imageUrls[0]]);
  expect((await listings._get({ listing }))[0].seller).toBe('seller');
  expect(await listings._mayBuy({ listing, buyer: 'seller' })).toEqual({ allowed: false });
  expect(await listings._mayBuy({ listing, buyer: 'buyer' })).toEqual({ allowed: true });
  expect(await listings._get({ listing: 'missing' })).toEqual([]);
  const tagged = await listings.create({ seller: 'seller', details: JSON.stringify({ ...value, tags: ['Desk Lamp', ' desk lamp ', ' Custom   Tag '] }) });
  expect(JSON.parse((await listings._get({ listing: tagged.listing }))[0].details).tags).toEqual(['desk lamp', 'custom tag']);
  const clothing = await listings.create({ seller: 'seller', details: JSON.stringify({ ...value, clothingSize: ' medium ' }) });
  expect(JSON.parse((await listings._get({ listing: clothing.listing }))[0].details).clothingSize).toBe('M');
  const numeric = await listings.create({ seller: 'seller', details: JSON.stringify({ ...value, clothingSize: ' us 8 ' }) });
  expect(JSON.parse((await listings._get({ listing: numeric.listing }))[0].details).clothingSize).toBe('US 8');
  await expect(listings.create({ seller: 'seller', details: JSON.stringify({ ...value, clothingSize: 8 }) })).rejects.toBeInstanceOf(InvalidListing);
  await expect(listings.create({ seller: 'seller', details: JSON.stringify({ ...value, tags: ['x'.repeat(41)] }) })).rejects.toBeInstanceOf(InvalidListing);
});
test('Claiming enforces availability and claimer identity on completion', async () => {
  const claims = new ClaimingConcept();
  const resource = crypto.randomUUID();
  await claims.makeAvailable({ resource });
  await expect(claims.makeAvailable({ resource })).rejects.toBeInstanceOf(ClaimUnavailable);
  await claims.claim({ resource, claimer: 'buyer' });
  await expect(claims.claim({ resource, claimer: 'rival' })).rejects.toBeInstanceOf(ClaimUnavailable);
  await expect(claims.complete({ resource, claimer: 'rival' })).rejects.toBeInstanceOf(ClaimUnavailable);
  await expect(claims.release({ resource, claimer: 'rival' })).rejects.toBeInstanceOf(ClaimUnavailable);
  await claims.release({ resource, claimer: 'buyer' });
  expect((await claims._get({ resource }))[0]).toEqual({ status: 'available', claimer: '' });
  await claims.claim({ resource, claimer: 'buyer' });
  await claims.complete({ resource, claimer: 'buyer' });
  expect((await claims._get({ resource }))[0].status).toBe('completed');
});
test('TransactionConfirming enforces payment order and both parties', async () => {
  const transactions = new TransactionConfirmingConcept();
  const subject = crypto.randomUUID();
  await transactions.start({ subject, payer: 'buyer', payee: 'seller' });
  await expect(transactions.start({ subject, payer: 'buyer', payee: 'seller' })).rejects.toBeInstanceOf(InvalidTransaction);
  await expect(transactions.confirmReceived({ subject, payee: 'seller' })).rejects.toBeInstanceOf(InvalidTransaction);
  await expect(transactions.reportPaid({ subject, payer: 'other' })).rejects.toBeInstanceOf(InvalidTransaction);
  await transactions.reportPaid({ subject, payer: 'buyer' });
  await expect(transactions.confirmReceived({ subject, payee: 'other' })).rejects.toBeInstanceOf(InvalidTransaction);
  await transactions.confirmReceived({ subject, payee: 'seller' });
  expect((await transactions._get({ subject }))[0].status).toBe('confirmed');
});
test('payment reporting and cancellation cannot both win; cancellation permits a fresh transaction', async () => {
  const transactions = new TransactionConfirmingConcept();
  const subject = crypto.randomUUID();
  await transactions.start({ subject, payer: 'buyer', payee: 'seller' });
  await expect(transactions.cancel({ subject, actor: 'other' })).rejects.toBeInstanceOf(CancellationUnavailable);
  const race = await Promise.allSettled([
    transactions.cancel({ subject, actor: 'buyer' }),
    transactions.reportPaid({ subject, payer: 'buyer' }),
  ]);
  expect(race.filter(result => result.status === 'fulfilled')).toHaveLength(1);
  if (race[0].status === 'fulfilled') {
    expect(await transactions._get({ subject })).toEqual([]);
    await transactions.start({ subject, payer: 'nextBuyer', payee: 'seller' });
    expect((await transactions._get({ subject }))[0].payer).toBe('nextBuyer');
  } else {
    expect((await transactions._get({ subject }))[0].status).toBe('awaitingConfirmation');
    await expect(transactions.cancel({ subject, actor: 'buyer' })).rejects.toBeInstanceOf(CancellationUnavailable);
  }
});

