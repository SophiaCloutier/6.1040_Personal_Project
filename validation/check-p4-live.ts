// Run explicitly: bun run validation/check-p4-live.ts --live
// Creates two temporary-purpose accounts; removes its listing and ends sessions.
if (!Bun.argv.includes('--live')) throw new Error('Pass --live to test the deployed app.');
const origin = 'https://claimed.mit-sdg.dev';
const suffix = crypto.randomUUID().slice(0, 8);
const password = crypto.randomUUID();
const cookies: string[] = [];
let listing = '';
let sellerCookie = '';
let buyerCookie = '';
async function call(path: string, body: object = {}, cookie = '') {
  const response = await fetch(`${origin}/api${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: cookie },
    body: JSON.stringify(body), signal: AbortSignal.timeout(15000),
  });
  const data = await response.json() as any;
  const issued = response.headers.get('set-cookie')?.split(';')[0] ?? '';
  if (issued) cookies.push(issued);
  return { status: response.status, data, cookie: issued };
}
function check(ok: boolean, label: string) {
  if (!ok) throw new Error(label);
  console.log(`PASS: ${label}`);
}
try {
  const health = await fetch(`${origin}/health`);
  check(health.ok && (await health.json() as any).ok, 'deployed health');
  check((await fetch(origin)).ok, 'deployed frontend');
  check((await call('/marketplace/activity')).status === 401, 'guest cannot read signed-in activity');
  const seller = await call('/auth/register', { username: `p4s_${suffix}`, password });
  sellerCookie = seller.cookie;
  const buyer = await call('/auth/register', { username: `p4b_${suffix}`, password });
  buyerCookie = buyer.cookie;
  check(seller.status === 200 && buyer.status === 200, 'two separate accounts');
  const details = JSON.stringify({ title: `P4 validation ${suffix}`, description: 'Temporary automated validation listing', price: 1, pickup: 'Test only', payment: 'Private test instructions' });
  const published = await call('/marketplace/publish', { details }, sellerCookie);
  listing = published.data.listing;
  check(published.status === 200 && !!listing, 'seller publishes');
  const publicRows = (await call('/marketplace/list')).data.marketplace.listings;
  const publicRow = publicRows.find((row: any) => row.listing === listing);
  check(!!publicRow && JSON.parse(publicRow.details).payment === undefined, 'public listing hides payment instructions');
  check((await call('/marketplace/remove', { listing }, buyerCookie)).status === 400, 'buyer cannot remove seller listing');
  check((await call('/marketplace/claim', { listing }, sellerCookie)).status === 403, 'seller cannot buy own listing');
  check((await call('/marketplace/claim', { listing }, buyerCookie)).status === 200, 'buyer reserves listing');
  check((await call('/marketplace/confirm', { listing }, sellerCookie)).status === 403, 'receipt before payment is rejected');
  check((await call('/marketplace/report-paid', { listing }, sellerCookie)).status === 403, 'seller cannot report buyer payment');
  await call('/auth/sign-out', {}, buyerCookie);
  const signedIn = await call('/auth/sign-in', { username: `p4b_${suffix}`, password });
  buyerCookie = signedIn.cookie;
  const persisted = (await call('/marketplace/activity', {}, buyerCookie)).data.marketplace.listings.find((row: any) => row.listing === listing);
  check(persisted?.claim.status === 'claimed', 'reservation survives sign-out and new session');
  check((await call('/marketplace/cancel', { listing }, buyerCookie)).status === 200, 'buyer cancels unpaid reservation');
  check((await call('/marketplace/remove', { listing }, sellerCookie)).status === 200, 'seller removes released validation listing');
  check(!(await call('/marketplace/list')).data.marketplace.listings.some((row: any) => row.listing === listing), 'removed listing absent from public browsing');
  listing = '';
} finally {
  if (listing && buyerCookie) await call('/marketplace/cancel', { listing }, buyerCookie).catch(() => {});
  if (listing && sellerCookie) await call('/marketplace/remove', { listing }, sellerCookie).catch(() => {});
  for (const cookie of new Set(cookies)) await call('/auth/sign-out', {}, cookie).catch(() => {});
}
