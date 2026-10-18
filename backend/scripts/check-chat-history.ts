// Disposable history fixture for the browser check; refuses the main database.
if (process.env.MONGODB_DATABASE !== 'claimed_regression_ui_20261017') throw new Error('Use only the isolated browser-check database.');
const { createGateway } = await import('@mit-sdg/sync-engine/boundary');
const { createHttpHandler } = await import('@mit-sdg/sync-engine-http/handler');
const { assembleApplication } = await import('../src/assembly.ts');
const { policy } = await import('../src/edge.ts');
const { MessagingConcept } = await import('../src/concepts/Messaging.ts');
const app = assembleApplication(), handler = createHttpHandler({ application: app, gateway: createGateway({ application: app }), policy });
async function call(path: string, body = {}, cookie = '') {
  const response = await handler(new Request('http://localhost:3000/api' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000', Cookie: cookie }, body: JSON.stringify(body) }));
  const result = await response.json() as any;
  if (!response.ok || result.error) throw new Error(path + ': ' + JSON.stringify(result));
  return { ...result, cookie: response.headers.get('set-cookie')?.split(';')[0] ?? cookie };
}
const seller = await call('/auth/sign-in', { username: 'regression_seller', password: 'Local-test-password-2026' });
const { listing } = await call('/marketplace/publish', { details: JSON.stringify({ title: 'History pagination check', price: 10, description: 'Disposable conversation-history fixture', pickup: 'Test lobby', payment: 'Demo only' }) }, seller.cookie);
const messaging = new MessagingConcept();
await messaging.send({ actor: 'regression_buyer', buyer: 'regression_buyer', seller: 'regression_seller', subject: listing, text: 'The very first message in this conversation.' });
await Promise.all(Array.from({ length: 224 }, (_, index) => messaging.send({ actor: index % 2 ? 'regression_seller' : 'regression_buyer', buyer: 'regression_buyer', seller: 'regression_seller', subject: listing, text: 'History check message ' + (index + 2) })));
console.log('Created 225 messages for', listing);
process.exit(0);
