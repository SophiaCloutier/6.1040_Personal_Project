import { endpoint, receive, respond } from '@mit-sdg/sync-engine/boundary';
import { each, form, former, reaction, view, when, where, whether, no } from '@mit-sdg/sync-engine/language';
import { concepts } from '../concepts.ts';
import { validator, sessionOnlyInput } from './validators.ts';
const { Listing, Claiming, TransactionConfirming, Sessioning } = concepts;

const identityInput = validator(v => Object.keys(v).length === 2 && (typeof v.session === 'string' || v.session === null) && typeof v.listing === 'string' && v.listing.length > 0 && v.listing.length <= 100, 'A listing identifier is required.');
const createInput = validator(v => Object.keys(v).length === 2 && (typeof v.session === 'string' || v.session === null) && typeof v.details === 'string' && v.details.length <= 10000, 'Listing details must be valid text.');

const MakeAvailable = reaction(({ listing }) => when(Listing.create({}).responds({ listing })).then(Claiming.makeAvailable({ resource: listing })));
const StartTransaction = reaction(({ buyer, listing, seller }) =>
  when(Claiming.claim({ claimer: buyer, resource: listing }).responds({}))
    .where(Listing._get({ listing }).is({ seller }))
    .then(TransactionConfirming.start({ payer: buyer, payee: seller, subject: listing })));
const CompleteClaim = reaction(({ listing, buyer }) =>
  when(TransactionConfirming.confirmReceived({ subject: listing }).responds({}))
    .where(Claiming._get({ resource: listing }).is({ claimer: buyer }))
    .then(Claiming.complete({ resource: listing, claimer: buyer })));
const ReleaseCancelled = reaction(({ listing, buyer }) =>
  when(TransactionConfirming.cancel({ subject: listing }).responds({ payer: buyer }))
    .then(Claiming.release({ resource: listing, claimer: buyer })));

const BuyerAllowed = view('(buyer) may buy (listing)', ({ buyer, listing }) => where(Listing._mayBuy({ buyer, listing }).is({ allowed: true }))).holds();
const BuyerDenied = view('(buyer) may not buy (listing)', ({ buyer, listing }) => where(Listing._mayBuy({ buyer, listing }).is({ allowed: false }))).holds();
const Marketplace = former('the marketplace', (_input, { listing, seller, details, status, claimer, paymentStatus, payer, payee }) => form({
  listings: each(Listing._all({}).is({ listing, seller, details })).form({
    listing, seller, details,
    claim: where(Claiming._get({ resource: listing }).is({ status, claimer })).form({ status, claimer }),
    transaction: where(whether(TransactionConfirming._get({ subject: listing }).is({ status: paymentStatus, payer, payee }))).form({ status: paymentStatus, payer, payee }),
  }),
}));
const PublicMarketplace = former('the public marketplace', (_input, { listing, seller, details, status }) => form({
  listings: each(Listing._publicAll({}).is({ listing, seller, details })).where(no(Claiming._get({ resource: listing }).is({ status: 'completed' }))).form({
    listing, seller, details,
    claim: where(Claiming._get({ resource: listing }).is({ status })).form({ status }),
  }),
}));
const Browse = endpoint('/marketplace/list', () => receive({})
  .then(respond({ marketplace: PublicMarketplace({}) })), { validators: { input: validator(v => Object.keys(v).length === 0, 'No input is required.') } });
const Activity = endpoint('/marketplace/activity', ({ session, user }) => receive({ session })
  .then(Sessioning.current({ session }).responds({ subject: user }))
  .then(respond({ marketplace: Marketplace({}) })), { input: { required: ['session'] }, validators: { input: sessionOnlyInput } });
const Publish = endpoint('/marketplace/publish', ({ session, user, details, listing }) => receive({ session, details })
  .then(Sessioning.current({ session }).responds({ subject: user }))
  .then(Listing.create({ seller: user, details }).responds({ listing }))
  .then(respond({ listing })), { input: { required: ['session', 'details'] }, validators: { input: createInput } });
const Claim = endpoint('/marketplace/claim', ({ session, user, listing }) => receive({ session, listing })
  .then(Sessioning.current({ session }).responds({ subject: user }))
  .then(
    where(BuyerAllowed({ buyer: user, listing })).then(Claiming.claim({ claimer: user, resource: listing })).then(respond({ listing })).named('allowed'),
    where(BuyerDenied({ buyer: user, listing })).then(respond({ error: 'CANNOT_BUY' })).named('denied'),
  ), { input: { required: ['session', 'listing'] }, validators: { input: identityInput } });
const ReportPaid = endpoint('/marketplace/report-paid', ({ session, user, listing }) => receive({ session, listing })
  .then(Sessioning.current({ session }).responds({ subject: user }))
  .then(TransactionConfirming.reportPaid({ payer: user, subject: listing }))
  .then(respond({ listing })), { input: { required: ['session', 'listing'] }, validators: { input: identityInput } });
const Confirm = endpoint('/marketplace/confirm', ({ session, user, listing }) => receive({ session, listing })
  .then(Sessioning.current({ session }).responds({ subject: user }))
  .then(TransactionConfirming.confirmReceived({ payee: user, subject: listing }))
  .then(respond({ listing })), { input: { required: ['session', 'listing'] }, validators: { input: identityInput } });
const Cancel = endpoint('/marketplace/cancel', ({ session, user, listing }) => receive({ session, listing })
  .then(Sessioning.current({ session }).responds({ subject: user }))
  .then(TransactionConfirming.cancel({ actor: user, subject: listing }))
  .then(respond({ listing })), { input: { required: ['session', 'listing'] }, validators: { input: identityInput } });
export const composition = { Workflow: { MakeAvailable, StartTransaction, CompleteClaim, ReleaseCancelled, BuyerAllowed, BuyerDenied, Marketplace, PublicMarketplace, Browse, Activity, Publish, Claim, ReportPaid, Confirm, Cancel } };

