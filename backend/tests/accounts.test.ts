import { afterAll, expect, test } from 'bun:test';
import { MongoClient } from 'mongodb';
import { AuthenticatingConcept, InvalidCredentials, UsernameTaken, WeakPassword } from '../src/concepts/Authenticating.ts';
import { SessioningConcept, UnknownSession } from '../src/concepts/Sessioning.ts';

process.env.MONGODB_DATABASE = `claimed_test_${crypto.randomUUID().replaceAll('-', '')}`;
const databaseName = process.env.MONGODB_DATABASE;
const admin = new MongoClient(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017');
afterAll(async () => { await admin.db(databaseName).dropDatabase(); await admin.close(); });

test('registration persists hashed credentials, rejects duplicates, and authenticates after reconstruction', async () => {
  const auth = new AuthenticatingConcept();
  await expect(auth.register({ username: 'sophia', password: 'short' })).rejects.toBeInstanceOf(WeakPassword);
  await auth.register({ username: 'sophia', password: 'chair-sale-password' });
  const row = await admin.db(databaseName).collection('accounts').findOne({ username: 'sophia' });
  expect(row?.passwordVerifier).toStartWith('$argon2id$');
  expect(row?.password).toBeUndefined();
  await expect(auth.register({ username: 'sophia', password: 'different-password' })).rejects.toBeInstanceOf(UsernameTaken);
  const restarted = new AuthenticatingConcept();
  expect(await restarted.authenticate({ username: 'sophia', password: 'chair-sale-password' })).toEqual({ account: 'sophia' });
  await expect(restarted.authenticate({ username: 'sophia', password: 'wrong-password' })).rejects.toBeInstanceOf(InvalidCredentials);
});

test('sessions persist, expire, and become unusable after sign-out', async () => {
  const sessions = new SessioningConcept();
  const issued = await sessions.start({ subject: 'percy' });
  expect(await new SessioningConcept().current({ session: issued.session })).toEqual({ subject: 'percy' });
  await sessions.end({ session: issued.session });
  await expect(sessions.current({ session: issued.session })).rejects.toBeInstanceOf(UnknownSession);
  const expired = await sessions.start({ subject: 'percy' });
  await admin.db(databaseName).collection('sessions').updateOne({ session: expired.session }, { $set: { expiresAt: new Date(0) } });
  await expect(sessions.current({ session: expired.session })).rejects.toBeInstanceOf(UnknownSession);
});
