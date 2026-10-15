import { MongoClient } from 'mongodb';
import { createGateway } from '@mit-sdg/sync-engine/boundary';
import { createHttpHandler } from '@mit-sdg/sync-engine-http/handler';
import { assembleApplication } from '../src/assembly.ts';
import { policy } from '../src/edge.ts';
import { AuthenticatingConcept } from '../src/concepts/Authenticating.ts';
import { SessioningConcept } from '../src/concepts/Sessioning.ts';
import { ImageUploadingConcept } from '../src/concepts/ImageUploading.ts';

if (!Bun.argv.includes('--replace-listings')) throw new Error('Pass --replace-listings explicitly to replace existing listings, claims, and their transactions. Accounts and images are preserved.');
const client = new MongoClient(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017');
const db = client.db(process.env.MONGODB_DATABASE ?? 'claimed');
const sessions = new SessioningConcept();
const auth = new AuthenticatingConcept();
const images = new ImageUploadingConcept();
const application = assembleApplication();
const handler = createHttpHandler({ application, gateway: createGateway({ application }), policy });
const issuedSessions: string[] = [];
const created: string[] = [];
let replacing = false;
const existing = (await db.collection('listings').find({}, { projection: { listing: 1 } }).toArray()).map(row => row.listing);
async function account(preferred: string, fallback: string) {
  if ((await auth._registered({ username: preferred })).registered) return preferred;
  if (!(await auth._registered({ username: fallback })).registered) await auth.register({ username: fallback, password: 'Demo-market-2026!' });
  return fallback;
}
async function cookie(subject: string) {
  const issued = await sessions.start({ subject }); issuedSessions.push(issued.session);
  return '__Host-claimed-session=' + encodeURIComponent(issued.session);
}
async function call(path: string, input: object, cookie: string) {
  const response = await handler(new Request('http://localhost:3000/api' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000', Cookie: cookie }, body: JSON.stringify(input) }));
  const body = await response.json() as Record<string, any>;
  if (!response.ok || body.error) throw new Error(path + ': ' + JSON.stringify(body));
  return body;
}
const fixtures = [
  { title: 'Black embroidered cami top', category: 'Clothing', tags: ['clothing', 'shirts', 'summer gear'], clothingSize: 'S', price: 18, pickup: 'Maseeh Hall lobby', description: 'Black strappy top with embroidered cutout detailing. Front and back photos included. Demo size S; check fit at pickup.', files: ['P0.jpg', 'P0 (1).jpg'], state: 'available' },
  { title: 'Plaid pleated mini skirt', category: 'Clothing', tags: ['clothing', 'skirts', 'medium'], clothingSize: 'M', price: 15, pickup: 'Simmons Hall lobby', description: 'Black-and-white plaid pleated skirt. Size M is visible on the label; see the second photo.', files: ['P0 (2).jpg', 'P0 (3).jpg'], state: 'reserved' },
  { title: 'Floral two-piece swimsuit', category: 'Clothing', tags: ['clothing', 'swimwear', 'summer gear'], clothingSize: 'M', price: 12, pickup: 'Baker House lobby', description: 'Matching floral two-piece swimsuit with lace trim. Demo size M; verify fit before purchase.', files: ['P0 (4).jpg'], state: 'payment-sent' },
  { title: 'Merriam-Webster Dictionary — course reference', category: 'Books', tags: ['books', 'textbooks', 'reference', 'school supplies'], clothingSize: '', price: 8, pickup: 'Hayden Library entrance', description: 'Merriam-Webster dictionary for writing and coursework. The supplied photo shows the reference book cover.', files: ['71au8YeWgLL._AC_UF1000,1000_QL80_.jpg'], state: 'available' },
  { title: 'Mesh-back office chair', category: 'Furniture', tags: ['furniture', 'chair', 'office chair', 'dorm essentials'], clothingSize: '', price: 40, pickup: 'MacGregor House lobby', description: 'Black mesh-back office chair with armrests and rolling base. This demo sale is completed and retained in buyer/seller activity.', files: ['00P0P_6TWrpDDT8JK_0lM0CI_1200x900.jpg'], state: 'completed' },
];
try {
  // Read and process every supplied photo before changing listing records.
  const uploaded = new Map<string, string>();
  for (const fixture of fixtures) for (const filename of fixture.files) {
    const file = Bun.file(new URL('../../demo_pics/' + filename, import.meta.url));
    uploaded.set(filename, (await images.store({ data: Buffer.from(await file.arrayBuffer()).toString('base64'), mime: 'image/jpeg' })).image);
  }
  const seller = await account('sophia', 'demo_sophia');
  const buyer = await account('buyer_alex', 'demo_percy');
  const sellerCookie = await cookie(seller), buyerCookie = await cookie(buyer);
  const summary = [];
  for (const fixture of fixtures) {
    const photos = fixture.files.map(file => uploaded.get(file)!);
    const { listing } = await call('/marketplace/publish', { details: JSON.stringify({ title: fixture.title, category: fixture.category, tags: fixture.tags, clothingSize: fixture.clothingSize, price: fixture.price, pickup: fixture.pickup, description: fixture.description, images: photos, image: photos[0], payment: 'Demo only — do not send real payment.' }) }, sellerCookie);
    created.push(listing);
    if (fixture.state !== 'available') await call('/marketplace/claim', { listing }, buyerCookie);
    if (['payment-sent', 'completed'].includes(fixture.state)) await call('/marketplace/report-paid', { listing }, buyerCookie);
    if (fixture.state === 'completed') await call('/marketplace/confirm', { listing }, sellerCookie);
    summary.push({ title: fixture.title, state: fixture.state, listing, photos: photos.length });
  }
  // Delete only listings present before this run, after all replacements succeed.
  replacing = true;
  await db.collection('transactions').deleteMany({ subject: { $in: existing } });
  await db.collection('claims').deleteMany({ resource: { $in: existing } });
  await db.collection('listings').deleteMany({ listing: { $in: existing } });
  const publicPage = await call('/marketplace/list', {}, '');
  const sellerPage = await call('/marketplace/activity', {}, sellerCookie);
  const buyerPage = await call('/marketplace/activity', {}, buyerCookie);
  console.log(JSON.stringify({ seller, buyer, removed: existing.length, created: summary, marketplace: publicPage.marketplace.listings.length, sellerActivity: sellerPage.marketplace.listings.filter((row: any) => row.seller === seller).length, buyerActivity: buyerPage.marketplace.listings.filter((row: any) => row.claim.claimer === buyer).length }, null, 2));
} catch (error) {
  // Before replacement, failures remove only this run's new listing records.
  if (!replacing) {
    await db.collection('transactions').deleteMany({ subject: { $in: created } });
    await db.collection('claims').deleteMany({ resource: { $in: created } });
    await db.collection('listings').deleteMany({ listing: { $in: created } });
  }
  throw error;
} finally {
  for (const session of issuedSessions) await sessions.end({ session }).catch(() => {});
  await client.close();
}
process.exit(0);
