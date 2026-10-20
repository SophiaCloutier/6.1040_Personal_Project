import { endpoint, receive, respond } from '@mit-sdg/sync-engine/boundary';
import { each, form, former, reaction, view, when, where, whether, no } from '@mit-sdg/sync-engine/language';
import { concepts } from '../concepts.ts';
import { validator, sessionOnlyInput } from './validators.ts';
const { Listing, Claiming, TransactionConfirming, Sessioning, Negotiating } = concepts;

const identityInput = validator(v => Object.keys(v).length === 2 && (typeof v.session === 'string' || v.session === null) && typeof v.listing === 'string' && v.listing.length > 0 && v.listing.length <= 100, 'A listing identifier is required.');
const createInput = validator(v => Object.keys(v).length === 2 && (typeof v.session === 'string' || v.session === null) && typeof v.details === 'string' && v.details.length <= 10000, 'Listing details must be valid text.');

const MakeAvailable = reaction(({ listing }) => when(Listing.create({}).responds({ listing })).then(Claiming.makeAvailable({ resource: listing })));
const StartTransaction = reaction(({ buyer, listing, seller, terms }) =>
  when(Claiming.reserve({ claimer: buyer, resource: listing, terms }).responds({}))
    .where(Listing._get({ listing }).is({ seller }))
    .then(TransactionConfirming.startWithTerms({ payer: buyer, payee: seller, subject: listing, terms })));
const CloseOffers = reaction(({ buyer, listing, terms }) =>
  when(Claiming.reserve({ claimer: buyer, resource: listing, terms }).responds({}))
    .then(Negotiating.close({ subject: listing, buyer, terms })));
const FreezeReported = reaction(({ listing }) => when(TransactionConfirming.report({ subject: listing }).responds({})).then(Listing.freeze({ listing })));
const FreezeReportedLegacy = reaction(({ listing }) => when(TransactionConfirming.reportPaid({ subject: listing }).responds({})).then(Listing.freeze({ listing })));
const EditingBlocked = view('listing edits are closed', ({ listing }) => [
  where(Claiming._get({ resource: listing }).is({ status: 'completed' })),
  where(TransactionConfirming._get({ subject: listing }).is({ status: 'awaitingConfirmation' })),
  where(TransactionConfirming._get({ subject: listing }).is({ status: 'confirmed' })),
]).holds();
const CompleteClaim = reaction(({ listing, buyer }) =>
  when(TransactionConfirming.confirmReceived({ subject: listing }).responds({}))
    .where(Claiming._get({ resource: listing }).is({ claimer: buyer }))
    .then(Claiming.complete({ resource: listing, claimer: buyer })));
const ReleaseCancelled = reaction(({ listing, buyer }) =>
  when(TransactionConfirming.cancel({ subject: listing }).responds({ payer: buyer }))
    .then(Claiming.release({ resource: listing, claimer: buyer })));

const BuyerAllowed = view('(buyer) may buy (listing)', ({ buyer, listing }) => where(Listing._mayBuy({ buyer, listing }).is({ allowed: true }))).holds();
const BuyerDenied = view('(buyer) may not buy (listing)', ({ buyer, listing }) => where(Listing._mayBuy({ buyer, listing }).is({ allowed: false }))).holds();
const Marketplace = former('the marketplace', ({ user }, { listing, seller, details, status, claimer, paymentStatus, payer, payee }) => form({
  listings: each(Listing._visible({ reader: user }).is({ listing, seller, details })).form({
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
  .then(respond({ marketplace: Marketplace({ user }) })), { input: { required: ['session'] }, validators: { input: sessionOnlyInput } });
const Publish = endpoint('/marketplace/publish', ({ session, user, details, listing }) => receive({ session, details })
  .then(Sessioning.current({ session }).responds({ subject: user }))
  .then(Listing.create({ seller: user, details }).responds({ listing }))
  .then(respond({ listing })), { input: { required: ['session', 'details'] }, validators: { input: createInput } });
const Edit = endpoint('/marketplace/edit', ({ session, user, listing, details, previous }) => receive({ session, listing, details, previous })
  .then(Sessioning.current({ session }).responds({ subject: user }))
  .then(
    where(EditingBlocked({ listing })).then(respond({ error: 'LISTING_LOCKED' })).named('locked'),
    where(no(EditingBlocked({ listing }))).then(Listing.update({ seller: user, listing, details, previous }).responds({ listing })).then(respond({ listing })).named('editable'),
  ), { input: { required: ['session', 'listing', 'details', 'previous'] }, validators: { input: validator(v => Object.keys(v).length === 4 && (typeof v.session === 'string' || v.session === null) && typeof v.listing === 'string' && typeof v.details === 'string' && v.details.length <= 10000 && typeof v.previous === 'string' && v.previous.length <= 10000, 'Reopen the listing and check your changes.') } });
const Claim = endpoint('/marketplace/claim', ({ session, user, listing, seller, terms }) => receive({ session, listing })
  .then(Sessioning.current({ session }).responds({ subject: user }))
  .then(
    where(BuyerAllowed({ buyer: user, listing })).then(Listing.quote({ listing, buyer: user, amount: '' }).responds({ seller, terms })).then(Claiming.reserve({ claimer: user, resource: listing, terms })).then(respond({ listing })).named('allowed'),
    where(BuyerDenied({ buyer: user, listing })).then(respond({ error: 'CANNOT_BUY' })).named('denied'),
  ), { input: { required: ['session', 'listing'] }, validators: { input: identityInput } });
const ReportPaid = endpoint('/marketplace/report-paid', ({ session, user, listing }) => receive({ session, listing })
  .then(Sessioning.current({ session }).responds({ subject: user }))
  .then(TransactionConfirming.reportPaid({ payer: user, subject: listing }))
  .then(respond({ listing })), { input: { required: ['session', 'listing'] }, validators: { input: identityInput } });
const ReportEvidence = endpoint('/marketplace/report-evidence', ({ session, user, listing, data, mime }) => receive({ session, listing, data, mime })
  .then(Sessioning.current({ session }).responds({ subject: user }))
  .then(TransactionConfirming.report({ payer: user, subject: listing, data, mime }))
  .then(respond({ listing })), { input: { required: ['session', 'listing', 'data', 'mime'] }, validators: { input: validator(v => Object.keys(v).length === 4 && (typeof v.session === 'string' || v.session === null) && typeof v.listing === 'string' && typeof v.data === 'string' && v.data.length <= 7000000 && typeof v.mime === 'string', 'Choose an image up to 5 MB.') } });
const PaymentSnapshot = view('private payment snapshot', ({ user, listing }, { terms, evidence, details }) => where(
  TransactionConfirming._private({ subject: listing, actor: user }).is({ terms, evidence }),
  Listing._get({ listing }).is({ details }),
)).optional();
const PrivateTransaction = former('private transaction details', ({ user, listing }, { terms, evidence, details }) => form({
  payment: where(whether(PaymentSnapshot({ user, listing }).is({ terms, evidence, details }))).form({ terms, evidence, details }),
}));
const Payment = endpoint('/marketplace/payment', ({ session, user, listing }) => receive({ session, listing })
  .then(Sessioning.current({ session }).responds({ subject: user }))
  .then(respond({ transaction: PrivateTransaction({ user, listing }) })), { input: { required: ['session', 'listing'] }, validators: { input: identityInput } });
const Offers = former('my offers', ({ user }, { offer, buyer, seller, listing, terms, status }) => form({
  offers: each(Negotiating._inbox({ actor: user }).is({ offer, buyer, seller, subject: listing, terms, status })).form({ offer, buyer, seller, listing, terms, status }),
}));
const ListingOffers = former('public listing offers', ({ listing }, { offer, buyer, seller, terms, status }) => form({
  offers: each(Negotiating._public({ subject: listing }).is({ offer, buyer, seller, terms, status })).form({ offer, buyer, seller, listing, terms, status }),
}));
const PublicOffers = endpoint('/marketplace/listing-offers', ({ listing }) => receive({ listing })
  .then(respond({ inbox: ListingOffers({ listing }) })), { input: { required: ['listing'] }, validators: { input: validator(v => Object.keys(v).length === 1 && typeof v.listing === 'string' && v.listing.length > 0 && v.listing.length <= 100, 'A listing identifier is required.') } });
const OfferList = endpoint('/marketplace/offers', ({ session, user }) => receive({ session })
  .then(Sessioning.current({ session }).responds({ subject: user }))
  .then(respond({ inbox: Offers({ user }) })), { input: { required: ['session'] }, validators: { input: sessionOnlyInput } });
const Propose = endpoint('/marketplace/offer', ({ session, user, listing, amount, seller, terms, offer }) => receive({ session, listing, amount })
  .then(Sessioning.current({ session }).responds({ subject: user }))
  .then(Claiming.checkAvailable({ resource: listing }).responds({}))
  .then(Listing.quote({ listing, buyer: user, amount }).responds({ seller, terms }))
  .then(Negotiating.propose({ buyer: user, seller, subject: listing, terms }).responds({ offer }))
  .then(respond({ offer })), { input: { required: ['session', 'listing', 'amount'] }, validators: { input: validator(v => Object.keys(v).length === 3 && (typeof v.session === 'string' || v.session === null) && typeof v.listing === 'string' && typeof v.amount === 'string' && /^\d+(\.\d{1,2})?$/.test(v.amount), 'Enter a positive offer with at most two decimal places.') } });
const offerInput = validator(v => Object.keys(v).length === 2 && (typeof v.session === 'string' || v.session === null) && typeof v.offer === 'string' && v.offer.length <= 100, 'Choose an offer.');
const AcceptOffer = endpoint('/marketplace/accept-offer', ({ session, user, offer, buyer, listing, terms }) => receive({ session, offer })
  .then(Sessioning.current({ session }).responds({ subject: user }))
  .then(Negotiating.select({ actor: user, offer }).responds({ buyer, subject: listing, terms }))
  .then(Claiming.reserve({ claimer: buyer, resource: listing, terms }))
  .then(respond({ listing })), { input: { required: ['session', 'offer'] }, validators: { input: offerInput } });
const ResolveOffer = endpoint('/marketplace/resolve-offer', ({ session, user, offer, decision }) => receive({ session, offer, decision })
  .then(Sessioning.current({ session }).responds({ subject: user }))
  .then(Negotiating.resolve({ actor: user, offer, decision }))
  .then(respond({ offer })), { input: { required: ['session', 'offer', 'decision'] }, validators: { input: validator(v => Object.keys(v).length === 3 && (typeof v.session === 'string' || v.session === null) && typeof v.offer === 'string' && ['declined', 'withdrawn'].includes(String(v.decision)), 'Choose decline or withdraw.') } });
const Confirm = endpoint('/marketplace/confirm', ({ session, user, listing }) => receive({ session, listing })
  .then(Sessioning.current({ session }).responds({ subject: user }))
  .then(TransactionConfirming.confirmReceived({ payee: user, subject: listing }))
  .then(respond({ listing })), { input: { required: ['session', 'listing'] }, validators: { input: identityInput } });
const Cancel = endpoint('/marketplace/cancel', ({ session, user, listing }) => receive({ session, listing })
  .then(Sessioning.current({ session }).responds({ subject: user }))
  .then(TransactionConfirming.cancel({ actor: user, subject: listing }))
  .then(respond({ listing })), { input: { required: ['session', 'listing'] }, validators: { input: identityInput } });
export const composition = { Workflow: { MakeAvailable, FreezeReported, FreezeReportedLegacy, EditingBlocked, StartTransaction, CloseOffers, CompleteClaim, ReleaseCancelled, BuyerAllowed, BuyerDenied, Marketplace, PublicMarketplace, Browse, Activity, Publish, Edit, Claim, ReportPaid, ReportEvidence, PaymentSnapshot, PrivateTransaction, Payment, Offers, ListingOffers, PublicOffers, OfferList, Propose, AcceptOffer, ResolveOffer, Confirm, Cancel } };

