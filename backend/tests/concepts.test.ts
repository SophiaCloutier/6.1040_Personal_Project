import { afterAll, expect, test } from 'bun:test';
import { MongoClient } from 'mongodb';
import { ListingConcept, InvalidListing } from '../src/concepts/Listing.ts';
import { ClaimingConcept, ClaimUnavailable } from '../src/concepts/Claiming.ts';
import { TransactionConfirmingConcept, InvalidTransaction, CancellationUnavailable } from '../src/concepts/TransactionConfirming.ts';
const name = `claimed_test_${crypto.randomUUID().replaceAll('-', '')}`;
process.env.MONGODB_DATABASE = name;
const admin = new MongoClient('mongodb://127.0.0.1:27017');
afterAll(async () => { await admin.db(name).dropDatabase(); await admin.close(); });

test("Listing rejects invalid prices, required fields, and unsafe image URLs", async () => {
  const listings = new ListingConcept();
  const value = { title: 'Lamp', price: 10, description: 'A desk lamp', category: 'Other', pickup: 'Dorm lobby', payment: 'External payment', image: '' };
  for (const update of [{ price: -1 }, { title: '' }, { pickup: '' }, { image: 'javascript:alert(1)' }]) {
    await expect(listings.create({ seller: 'seller', details: JSON.stringify({ ...value, ...update }) })).rejects.toBeInstanceOf(InvalidListing);
  }
});

test("Listing preserves seller identity and prevents self-purchase", async () => {
  const listings = new ListingConcept();
  const value = { title: 'Lamp', price: 10, description: 'A desk lamp', category: 'Other', pickup: 'Dorm lobby', payment: 'External payment', image: '' };
  const { listing } = await listings.create({ seller: 'seller', details: JSON.stringify(value) });
  expect(JSON.parse((await listings._get({ listing }))[0].details).images).toEqual([]);
  expect((await listings._get({ listing }))[0].seller).toBe('seller');
  expect(await listings._mayBuy({ listing, buyer: 'seller' })).toEqual({ allowed: false });
  expect(await listings._mayBuy({ listing, buyer: 'buyer' })).toEqual({ allowed: true });
  expect(await listings._get({ listing: 'missing' })).toEqual([]);
});

test("Listing preserves ordered galleries and rejects oversized or unsafe galleries", async () => {
  const listings = new ListingConcept();
  const value = { title: 'Lamp', price: 10, description: 'A desk lamp', category: 'Other', pickup: 'Dorm lobby', payment: 'External payment', image: '' };
  const imageUrls = Array.from({ length: 5 }, (_, n) => `https://example.com/item-${n}.jpg`);
  const gallery = await listings.create({ seller: 'seller', details: JSON.stringify({ ...value, images: imageUrls }) });
  const galleryDetails = JSON.parse((await listings._get({ listing: gallery.listing }))[0].details);
  expect(galleryDetails.images).toEqual(imageUrls);
  expect(galleryDetails.image).toBe(imageUrls[0]);
  await expect(listings.create({ seller: 'seller', details: JSON.stringify({ ...value, images: [...imageUrls, 'https://example.com/six.jpg'] }) })).rejects.toBeInstanceOf(InvalidListing);
  await expect(listings.create({ seller: 'seller', details: JSON.stringify({ ...value, images: ['javascript:alert(1)'] }) })).rejects.toBeInstanceOf(InvalidListing);
});

test("Listing migrates a legacy single photo to an ordered gallery", async () => {
  const listings = new ListingConcept();
  const value = { title: 'Lamp', price: 10, description: 'A desk lamp', category: 'Other', pickup: 'Dorm lobby', payment: 'External payment', image: '' };
  const imageUrls = ['https://example.com/item.jpg'];
  const legacy = await listings.create({ seller: 'seller', details: JSON.stringify({ ...value, image: imageUrls[0] }) });
  expect(JSON.parse((await listings._get({ listing: legacy.listing }))[0].details).images).toEqual([imageUrls[0]]);
});

test("Listing normalizes and deduplicates tags and rejects overlong tags", async () => {
  const listings = new ListingConcept();
  const value = { title: 'Lamp', price: 10, description: 'A desk lamp', category: 'Other', pickup: 'Dorm lobby', payment: 'External payment', image: '' };
  const tagged = await listings.create({ seller: 'seller', details: JSON.stringify({ ...value, tags: ['Desk Lamp', ' desk lamp ', ' Custom   Tag '] }) });
  expect(JSON.parse((await listings._get({ listing: tagged.listing }))[0].details).tags).toEqual(['desk lamp', 'custom tag']);
  await expect(listings.create({ seller: 'seller', details: JSON.stringify({ ...value, tags: ['x'.repeat(41)] }) })).rejects.toBeInstanceOf(InvalidListing);
});

test("Listing normalizes optional sizes and rejects non-text sizes", async () => {
  const listings = new ListingConcept();
  const value = { title: 'Lamp', price: 10, description: 'A desk lamp', category: 'Other', pickup: 'Dorm lobby', payment: 'External payment', image: '' };
  const clothing = await listings.create({ seller: 'seller', details: JSON.stringify({ ...value, clothingSize: ' medium ' }) });
  expect(JSON.parse((await listings._get({ listing: clothing.listing }))[0].details).clothingSize).toBe('M');
  const numeric = await listings.create({ seller: 'seller', details: JSON.stringify({ ...value, clothingSize: ' us 8 ' }) });
  expect(JSON.parse((await listings._get({ listing: numeric.listing }))[0].details).clothingSize).toBe('US 8');
  await expect(listings.create({ seller: 'seller', details: JSON.stringify({ ...value, clothingSize: 8 }) })).rejects.toBeInstanceOf(InvalidListing);
});

test("Claiming permits only one claimant for an available resource", async () => {
  const claims = new ClaimingConcept();
  const resource = crypto.randomUUID();
  await claims.makeAvailable({ resource });
  await expect(claims.makeAvailable({ resource })).rejects.toBeInstanceOf(ClaimUnavailable);
  await claims.claim({ resource, claimer: 'buyer' });
  await expect(claims.claim({ resource, claimer: 'rival' })).rejects.toBeInstanceOf(ClaimUnavailable);
});

test("Claiming rejects release and completion by another claimant", async () => {
  const claims = new ClaimingConcept();
  const resource = crypto.randomUUID();
  await claims.makeAvailable({ resource });
  await claims.claim({ resource, claimer: 'buyer' });
  await expect(claims.complete({ resource, claimer: 'rival' })).rejects.toBeInstanceOf(ClaimUnavailable);
  await expect(claims.release({ resource, claimer: 'rival' })).rejects.toBeInstanceOf(ClaimUnavailable);
});

test("Claiming releases a reservation for reuse and completes a later claim", async () => {
  const claims = new ClaimingConcept();
  const resource = crypto.randomUUID();
  await claims.makeAvailable({ resource });
  await claims.claim({ resource, claimer: 'buyer' });
  await claims.release({ resource, claimer: 'buyer' });
  expect((await claims._get({ resource }))[0]).toEqual({ status: 'available', claimer: '' });
  await claims.claim({ resource, claimer: 'buyer' });
  await claims.complete({ resource, claimer: 'buyer' });
  expect((await claims._get({ resource }))[0].status).toBe('completed');
});
test("TransactionConfirming follows report then receipt confirmation", async () => {
  const transactions = new TransactionConfirmingConcept();
  const subject = crypto.randomUUID();
  await transactions.start({ subject, payer: 'buyer', payee: 'seller' });
  await transactions.reportPaid({ subject, payer: 'buyer' });
  await transactions.confirmReceived({ subject, payee: 'seller' });
  expect((await transactions._get({ subject }))[0].status).toBe('confirmed');
});

test("TransactionConfirming rejects duplicate starts, premature receipt, and wrong payer", async () => {
  const transactions = new TransactionConfirmingConcept();
  const subject = crypto.randomUUID();
  await transactions.start({ subject, payer: 'buyer', payee: 'seller' });
  await expect(transactions.start({ subject, payer: 'buyer', payee: 'seller' })).rejects.toBeInstanceOf(InvalidTransaction);
  await expect(transactions.confirmReceived({ subject, payee: 'seller' })).rejects.toBeInstanceOf(InvalidTransaction);
  await expect(transactions.reportPaid({ subject, payer: 'other' })).rejects.toBeInstanceOf(InvalidTransaction);
});

test("TransactionConfirming rejects receipt confirmation by another payee", async () => {
  const transactions = new TransactionConfirmingConcept();
  const subject = crypto.randomUUID();
  await transactions.start({ subject, payer: 'buyer', payee: 'seller' });
  await transactions.reportPaid({ subject, payer: 'buyer' });
  await expect(transactions.confirmReceived({ subject, payee: 'other' })).rejects.toBeInstanceOf(InvalidTransaction);
  expect((await transactions._get({ subject }))[0].status).toBe('awaitingConfirmation');
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
