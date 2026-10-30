import { expect, test } from 'bun:test';
import { MongoClient } from 'mongodb';
import { NegotiatingConcept, InvalidOffer } from '../src/concepts/Negotiating';

test('Negotiating rejects self-offers without creating state', async () => {
  const database = `claimed_negotiating_${crypto.randomUUID().replaceAll('-', '')}`;
  process.env.MONGODB_DATABASE = database;
  const admin = new MongoClient(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017');
  const offers = new NegotiatingConcept();
  try {
    await expect(offers.propose({ buyer: 'seller', seller: 'seller', subject: 'chair', terms: '{}' })).rejects.toBeInstanceOf(InvalidOffer);
    expect(await offers._inbox({ actor: 'seller' })).toEqual([]);
  } finally {
    await admin.db(database).dropDatabase();
    await admin.close();
  }
});

test('Negotiating rejects unauthorized selection and resolution without changing offers', async () => {
  const database = `claimed_negotiating_${crypto.randomUUID().replaceAll('-', '')}`;
  process.env.MONGODB_DATABASE = database;
  const admin = new MongoClient(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017');
  const offers = new NegotiatingConcept();
  try {
    const first = await offers.propose({ buyer: 'buyer', seller: 'seller', subject: 'chair', terms: '{"price":20}' });
    await offers.propose({ buyer: 'rival', seller: 'seller', subject: 'chair', terms: '{"price":15}' });
    const before = await offers._inbox({ actor: 'seller' });
    await expect(offers.select({ actor: 'buyer', offer: first.offer })).rejects.toBeInstanceOf(InvalidOffer);
    await expect(offers.resolve({ actor: 'buyer', offer: first.offer, decision: 'declined' })).rejects.toBeInstanceOf(InvalidOffer);
    await expect(offers.resolve({ actor: 'seller', offer: first.offer, decision: 'accepted' })).rejects.toBeInstanceOf(InvalidOffer);
    expect(await offers._inbox({ actor: 'seller' })).toEqual(before);
  } finally {
    await admin.db(database).dropDatabase();
    await admin.close();
  }
});

test('Negotiating selects terms without reserving or changing pending offers', async () => {
  const database = `claimed_negotiating_${crypto.randomUUID().replaceAll('-', '')}`;
  process.env.MONGODB_DATABASE = database;
  const admin = new MongoClient(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017');
  const offers = new NegotiatingConcept();
  try {
    const first = await offers.propose({ buyer: 'buyer', seller: 'seller', subject: 'chair', terms: '{"price":20}' });
    await offers.propose({ buyer: 'rival', seller: 'seller', subject: 'chair', terms: '{"price":15}' });
    const before = await offers._inbox({ actor: 'seller' });
    const selected = await offers.select({ actor: 'seller', offer: first.offer });
    expect(selected).toEqual({ buyer: 'buyer', subject: 'chair', terms: JSON.stringify({ price: 20, offer: first.offer }) });
    expect(await offers._inbox({ actor: 'seller' })).toEqual(before);
  } finally {
    await admin.db(database).dropDatabase();
    await admin.close();
  }
});

test('Negotiating closes competing offers idempotently and refuses changes to closed offers', async () => {
  const database = `claimed_negotiating_${crypto.randomUUID().replaceAll('-', '')}`;
  process.env.MONGODB_DATABASE = database;
  const admin = new MongoClient(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017');
  const offers = new NegotiatingConcept();
  try {
    const first = await offers.propose({ buyer: 'buyer', seller: 'seller', subject: 'chair', terms: '{"price":20}' });
    await offers.propose({ buyer: 'rival', seller: 'seller', subject: 'chair', terms: '{"price":15}' });
    const selected = await offers.select({ actor: 'seller', offer: first.offer });
    await offers.close(selected);
    const closed = await offers._inbox({ actor: 'seller' });
    expect(closed.map(row => row.status)).toEqual(['accepted', 'superseded']);
    await offers.close(selected);
    expect(await offers._inbox({ actor: 'seller' })).toEqual(closed);
    await expect(offers.select({ actor: 'seller', offer: first.offer })).rejects.toBeInstanceOf(InvalidOffer);
    await expect(offers.resolve({ actor: 'buyer', offer: first.offer, decision: 'withdrawn' })).rejects.toBeInstanceOf(InvalidOffer);
    expect(await offers._inbox({ actor: 'seller' })).toEqual(closed);
    expect(await offers._inbox({ actor: 'outsider' })).toEqual([]);
  } finally {
    await admin.db(database).dropDatabase();
    await admin.close();
  }
});
