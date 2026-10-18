// Disposable fixtures for the local browser check; never runs against the main database.
if (process.env.MONGODB_DATABASE !== 'claimed_regression_ui_20261017') throw new Error('Use only the isolated browser-check database.');
const { createGateway } = await import('@mit-sdg/sync-engine/boundary');
const { createHttpHandler } = await import('@mit-sdg/sync-engine-http/handler');
const { assembleApplication } = await import('../src/assembly.ts');
const { policy } = await import('../src/edge.ts');
const app = assembleApplication(), handler = createHttpHandler({ application: app, gateway: createGateway({ application: app }), policy });
async function call(path: string, body = {}, cookie = '') {
  const response = await handler(new Request('http://localhost:3000/api' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000', Cookie: cookie }, body: JSON.stringify(body) }));
  const result = await response.json() as any;
  if (!response.ok || result.error) throw new Error(path + ': ' + JSON.stringify(result));
  return { ...result, cookie: response.headers.get('set-cookie')?.split(';')[0] ?? cookie };
}
const seller = await call('/auth/sign-in', { username: 'regression_seller', password: 'Local-test-password-2026' });
const buyer = await call('/auth/sign-in', { username: 'regression_buyer', password: 'Local-test-password-2026' });
for (const [title, stage] of [['Needs confirmation check', 'sent'], ['Active check', 'available'], ['Sold check', 'sold']]) {
  const { listing } = await call('/marketplace/publish', { details: JSON.stringify({ title, price: 12, description: 'Disposable activity ordering fixture', pickup: 'Test lobby', payment: 'Demo only' }) }, seller.cookie);
  if (stage !== 'available') {
    await call('/marketplace/claim', { listing }, buyer.cookie);
    await call('/marketplace/report-evidence', { listing, data: '', mime: '' }, buyer.cookie);
    if (stage === 'sold') await call('/marketplace/confirm', { listing }, seller.cookie);
  }
  console.log(title, stage, listing);
}

process.exit(0);
