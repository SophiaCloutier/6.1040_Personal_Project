import { MongoClient } from 'mongodb';

// Reuse the pool across concepts; separate databases still support isolated tests.
let client: MongoClient | undefined;
export function database() {
  client ??= new MongoClient(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/claimed', {
    maxPoolSize: 3, minPoolSize: 0, serverSelectionTimeoutMS: 5000,
  });
  return client.db(process.env.MONGODB_DATABASE || undefined);
}
