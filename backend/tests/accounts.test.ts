import { afterAll, expect, test } from 'bun:test';
import { MongoClient } from 'mongodb';
import { AuthenticatingConcept, InvalidCredentials, UsernameTaken, WeakPassword } from '../src/concepts/Authenticating.ts';
import { SessioningConcept, UnknownSession } from '../src/concepts/Sessioning.ts';

process.env.MONGODB_DATABASE = `claimed_test_${crypto.randomUUID().replaceAll('-', '')}`;
const databaseName = process.env.MONGODB_DATABASE;
const admin = new MongoClient(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017');
afterAll(async () => { await admin.db(databaseName).dropDatabase(); await admin.close(); });

test('Authenticating rejects weak passwords', async () => {
  const auth = new AuthenticatingConcept();
  await expect(auth.register({ username: 'sophia', password: 'short' })).rejects.toBeInstanceOf(WeakPassword);
});

test('Authenticating stores a salted hash and authenticates after reconstruction', async () => {
  const auth = new AuthenticatingConcept();
  await auth.register({ username: 'sophia', password: 'chair-sale-password' });
  const row = await admin.db(databaseName).collection('accounts').findOne({ username: 'sophia' });
  expect(row?.passwordVerifier).toStartWith('$argon2id$');
  expect(row?.password).toBeUndefined();
  const restarted = new AuthenticatingConcept();
  expect(await restarted.authenticate({ username: 'sophia', password: 'chair-sale-password' })).toEqual({ account: 'sophia' });
});

test('Authenticating rejects duplicate usernames and incorrect passwords', async () => {
  const auth = new AuthenticatingConcept();
  await auth.register({ username: 'duplicate', password: 'chair-sale-password' });
  await expect(auth.register({ username: 'duplicate', password: 'different-password' })).rejects.toBeInstanceOf(UsernameTaken);
  await expect(auth.authenticate({ username: 'duplicate', password: 'wrong-password' })).rejects.toBeInstanceOf(InvalidCredentials);
});

test('Sessioning persists an active session across reconstruction', async () => {
  const sessions = new SessioningConcept();
  const issued = await sessions.start({ subject: 'percy' });
  expect(await new SessioningConcept().current({ session: issued.session })).toEqual({ subject: 'percy' });
});

test('Sessioning refuses a session after sign-out', async () => {
  const sessions = new SessioningConcept();
  const issued = await sessions.start({ subject: 'percy' });
  await sessions.end({ session: issued.session });
  await expect(sessions.current({ session: issued.session })).rejects.toBeInstanceOf(UnknownSession);
});

test('Sessioning refuses an expired session', async () => {
  const sessions = new SessioningConcept();
  const expired = await sessions.start({ subject: 'percy' });
  await admin.db(databaseName).collection('sessions').updateOne({ session: expired.session }, { $set: { expiresAt: new Date(0) } });
  await expect(sessions.current({ session: expired.session })).rejects.toBeInstanceOf(UnknownSession);
});
