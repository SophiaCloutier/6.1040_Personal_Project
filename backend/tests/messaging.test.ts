import { expect, test } from 'bun:test';
import { MongoClient } from 'mongodb';
import { MessagingConcept } from '../src/concepts/Messaging';
import { ListingConcept, ListingLocked } from '../src/concepts/Listing';

test('busy threads do not hide older conversations and private thread history stays scoped', async () => {
  const database = `claimed_messages_${crypto.randomUUID().replaceAll('-', '')}`;
  process.env.MONGODB_DATABASE = database;
  const admin = new MongoClient(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017');
  const messaging = new MessagingConcept();
  try {
    const quiet = await messaging.send({ actor: 'quiet', buyer: 'quiet', seller: 'seller', subject: 'item', text: 'An older conversation' });
    await Promise.all(Array.from({ length: 501 }, (_, index) => messaging.send({ actor: 'busy', buyer: 'busy', seller: 'seller', subject: 'item', text: `Message ${index}` })));
    expect((await messaging._conversations({ actor: 'seller' })).map(row => row.buyer)).toEqual(['busy', 'quiet']);
    expect((await messaging._thread({ actor: 'seller', subject: 'item', buyer: 'quiet' })).map(row => row.text)).toEqual(['An older conversation']);
    expect(await messaging._thread({ actor: 'busy', subject: 'item', buyer: 'quiet' })).toEqual([]);
    expect((await messaging._thread({ actor: 'busy', subject: 'item', buyer: 'busy' })).length).toBe(200);
    expect(await messaging._conversations({ actor: 'outsider' })).toEqual([]);
    const newest = await messaging._history({ actor: 'seller', subject: 'item', buyer: 'busy', before: '' });
    const middle = await messaging._history({ actor: 'seller', subject: 'item', buyer: 'busy', before: newest[0].message });
    const oldest = await messaging._history({ actor: 'seller', subject: 'item', buyer: 'busy', before: middle[0].message });
    expect([newest.length, middle.length, oldest.length]).toEqual([200, 200, 101]);
    expect(new Set([...oldest, ...middle, ...newest].map(row => row.message)).size).toBe(501);
    expect(await messaging._history({ actor: 'seller', subject: 'item', buyer: 'busy', before: quiet.message })).toEqual([]);
    expect(await messaging._history({ actor: 'outsider', subject: 'item', buyer: 'busy', before: newest[0].message })).toEqual([]);
    expect(await messaging._history({ actor: 'seller', subject: 'item', buyer: 'busy', before: 'missing' })).toEqual([]);
  } finally { await admin.db(database).dropDatabase(); await admin.close(); }
}, 20000);

test('freezing a listing refuses subsequent concept updates without changing its details', async () => {
  const database = `claimed_frozen_${crypto.randomUUID().replaceAll('-', '')}`;
  process.env.MONGODB_DATABASE = database;
  const admin = new MongoClient(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017');
  const listings = new ListingConcept();
  try {
    const { listing } = await listings.create({ seller: 'seller', details: JSON.stringify({ title: 'Chair', price: 20, description: '', pickup: 'Lobby', payment: 'Cash' }) });
    const previous = (await listings._get({ listing }))[0].details;
    await listings.freeze({ listing }); await listings.freeze({ listing });
    await expect(listings.update({ listing, seller: 'seller', previous, details: JSON.stringify({ ...JSON.parse(previous), price: 5 }) })).rejects.toBeInstanceOf(ListingLocked);
    expect((await listings._get({ listing }))[0].details).toBe(previous);
  } finally { await admin.db(database).dropDatabase(); await admin.close(); }
});
