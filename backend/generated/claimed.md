<!-- Generated from the Claimed assembly. Do not edit. -->
<!-- Manifest producer: @mit-sdg/sync-engine@1.1.0; concept specification: sync-engine.concept-specification@1; renderer: @mit-sdg/sync-engine@1.1.0. -->

# Claimed — assembled read-back

_Assembled by sync-engine from registered concepts and composition. Edit the concept_
_specifications and composition source, then regenerate this file._

## Concepts

### Authenticating

Defined in [Authenticating](../design/concepts/Authenticating.md), line 1.

#### Actions

- `register(username: String, password: String) : returns (account: Account)`
  - Refuses `INVALID_USERNAME`: A username must contain 3 to 32 letters, numbers, underscores, or hyphens.
  - Refuses `WEAK_PASSWORD`: A password must contain 8 to 128 characters.
  - Refuses `USERNAME_TAKEN`: That username is already registered.
- `authenticate(username: String, password: String) : returns (account: Account)`
  - Refuses `INVALID_CREDENTIALS`: The username or password is incorrect.

#### Queries

- `_registered(username: String) : one (registered: Flag)`

#### Instances

- `Authenticating` — instance of `Authenticating` — [Claimed application types](../design/types.md), line 14.

### Claiming

Defined in [Claiming](../design/concepts/Claiming.md), line 1.

#### Actions

- `makeAvailable(resource: Resource) : returns (resource: Resource)`
  - Refuses `CLAIM_UNAVAILABLE`: This item already has an availability record.
- `claim(claimer: Claimer, resource: Resource) : returns (resource: Resource)`
  - Refuses `CLAIM_UNAVAILABLE`: This item is no longer available.
- `remove(resource: Resource) : returns (resource: Resource)`
  - Refuses `CLAIM_UNAVAILABLE`: Only available items can be removed.
- `checkAvailable(resource: Resource) : returns (resource: Resource)`
  - Refuses `CLAIM_UNAVAILABLE`: This item is no longer available.
- `reserve(claimer: Claimer, resource: Resource, terms: String) : returns (resource: Resource, claimer: Claimer, terms: String)`
  - Refuses `CLAIM_UNAVAILABLE`: This item is no longer available.
- `release(claimer: Claimer, resource: Resource) : returns (resource: Resource)`
  - Refuses `CLAIM_UNAVAILABLE`: Only the current claimer can release a reserved item.
- `complete(claimer: Claimer, resource: Resource) : returns (resource: Resource)`
  - Refuses `CLAIM_UNAVAILABLE`: This claim cannot be completed.

#### Queries

- `_get(resource: Resource) : optional (status: String, claimer: Claimer)`

#### Instances

- `Claiming` — instance of `Claiming` — [Claimed application types](../design/types.md), line 24.
  - `Claimer` is `Authenticating.Account` — [Claimed application types](../design/types.md), line 25.
  - `Resource` is `Listing.Listing` — [Claimed application types](../design/types.md), line 26.

### ImageUploading

Defined in [ImageUploading](../design/concepts/ImageUploading.md), line 1.

#### Actions

- `store(data: String, mime: String) : returns (image: String)`
  - Refuses `INVALID_IMAGE`: Choose a valid JPEG, PNG, or WebP photo up to 5 MB.

#### Instances

- `ImageUploading` — instance of `ImageUploading` — [Claimed application types](../design/types.md), line 16.

### Listing

Defined in [Listing](../design/concepts/Listing.md), line 1.

#### Actions

- `create(seller: Seller, details: String) : returns (listing: Listing)`
  - Refuses `INVALID_LISTING`: Enter valid listing information.
- `authorizeRemoval(seller: Seller, listing: Listing) : returns (listing: Listing)`
  - Refuses `INVALID_LISTING`: Only the seller can remove this listing.
- `owner(listing: Listing) : returns (seller: Seller)`
  - Refuses `INVALID_LISTING`: This listing no longer exists.
- `quote(listing: Listing, buyer: Seller, amount: String) : returns (seller: Seller, terms: String)`
  - Refuses `INVALID_LISTING`: Choose an available offer-enabled listing and a valid amount.
- `freeze(listing: Listing) : returns (listing: Listing)`
- `update(seller: Seller, listing: Listing, details: String, previous: String) : returns (listing: Listing)`
  - Refuses `LISTING_LOCKED`: Payment sent and sold listings cannot be edited.
  - Refuses `INVALID_LISTING`: Reopen the listing and check your changes.

#### Queries

- `_visible(reader: Seller) : many (listing: Listing, seller: Seller, details: String)`
- `_all() : many (listing: Listing, seller: Seller, details: String)`
- `_publicAll() : many (listing: Listing, seller: Seller, details: String)`
- `_get(listing: Listing) : optional (seller: Seller, details: String)`
- `_mayBuy(listing: Listing, buyer: Seller) : one (allowed: Flag)`

#### Instances

- `Listing` — instance of `Listing` — [Claimed application types](../design/types.md), line 21.
  - `Seller` is `Authenticating.Account` — [Claimed application types](../design/types.md), line 22.

### Messaging

Defined in [Messaging](../design/concepts/Messaging.md), line 1.

#### Actions

- `send(actor: Actor, buyer: Actor, seller: Actor, subject: Subject, text: String) : returns (message: Message)`
  - Refuses `INVALID_MESSAGE`: Write a valid message in your own conversation.

#### Queries

- `_conversations(actor: Actor) : many (subject: Subject, buyer: Actor, seller: Actor, message: Message, text: String, sentAt: String)`
- `_thread(actor: Actor, subject: Subject, buyer: Actor) : many (message: Message, subject: Subject, buyer: Actor, seller: Actor, sender: Actor, text: String, sentAt: String)`
- `_history(actor: Actor, subject: Subject, buyer: Actor, before: String) : many (message: Message, subject: Subject, buyer: Actor, seller: Actor, sender: Actor, text: String, sentAt: String)`
- `_inbox(actor: Actor) : many (message: Message, subject: Subject, buyer: Actor, seller: Actor, sender: Actor, text: String, sentAt: String)`

#### Instances

- `Messaging` — instance of `Messaging` — [Claimed application types](../design/types.md), line 10.
  - `Actor` is `Authenticating.Account` — [Claimed application types](../design/types.md), line 11.
  - `Subject` is `Listing.Listing` — [Claimed application types](../design/types.md), line 12.

### Negotiating

Defined in [Negotiating](../design/concepts/Negotiating.md), line 1.

#### Actions

- `propose(buyer: Actor, seller: Actor, subject: Subject, terms: String) : returns (offer: Offer)`
  - Refuses `INVALID_OFFER`: You cannot offer on your own listing.
- `resolve(actor: Actor, offer: Offer, decision: String) : returns (offer: Offer)`
  - Refuses `INVALID_OFFER`: Only the seller can decline and only the buyer can withdraw a pending offer.
- `close(subject: Subject, buyer: Actor, terms: String) : returns (subject: Subject)`
- `select(actor: Actor, offer: Offer) : returns (buyer: Actor, subject: Subject, terms: String)`
  - Refuses `INVALID_OFFER`: Only the seller can select pending offer terms.

#### Queries

- `_inbox(actor: Actor) : many (offer: Offer, buyer: Actor, seller: Actor, subject: Subject, terms: String, status: String)`
- `_public(subject: Subject) : many (offer: Offer, buyer: Actor, seller: Actor, subject: Subject, terms: String, status: String)`

#### Instances

- `Negotiating` — instance of `Negotiating` — [Claimed application types](../design/types.md), line 6.
  - `Actor` is `Authenticating.Account` — [Claimed application types](../design/types.md), line 7.
  - `Subject` is `Listing.Listing` — [Claimed application types](../design/types.md), line 8.

### Sessioning

Defined in [Sessioning](../design/concepts/Sessioning.md), line 1.

#### Actions

- `start(subject: Subject) : returns (session: Session, expiresAt: DateTime)`
- `current(session: Session) : returns (subject: Subject)`
  - Refuses `UNKNOWN_SESSION`: This session is not active.
- `end(session: Session) : returns (ended: Flag)`
  - Refuses `UNKNOWN_SESSION`: This session is not active.

#### Queries

- `_active(session: Session) : optional (subject: Subject, expiresAt: DateTime)`

#### Instances

- `Sessioning` — instance of `Sessioning` — [Claimed application types](../design/types.md), line 18.
  - `Subject` is `Authenticating.Account` — [Claimed application types](../design/types.md), line 19.

### TransactionConfirming

Defined in [TransactionConfirming](../design/concepts/TransactionConfirming.md), line 1.

#### Actions

- `startWithTerms(payer: Payer, payee: Payee, subject: Subject, terms: String) : returns (subject: Subject)`
  - Refuses `INVALID_TRANSACTION`: A transaction already exists.
- `report(payer: Payer, subject: Subject, data: String, mime: String) : returns (subject: Subject)`
  - Refuses `INVALID_IMAGE`: Choose a JPEG, PNG, or WebP up to 5 MB.
  - Refuses `INVALID_TRANSACTION`: Attach valid evidence to your unpaid transaction.
- `start(payer: Payer, payee: Payee, subject: Subject) : returns (subject: Subject)`
  - Refuses `INVALID_TRANSACTION`: A transaction already exists for this item.
- `reportPaid(payer: Payer, subject: Subject) : returns (subject: Subject)`
  - Refuses `INVALID_TRANSACTION`: Only the buyer can report payment on an unpaid transaction.
- `cancel(actor: Actor, subject: Subject) : returns (subject: Subject, payer: Payer)`
  - Refuses `CANCELLATION_UNAVAILABLE`: Only the buyer or seller can cancel before payment is reported.
- `confirmReceived(payee: Payee, subject: Subject) : returns (subject: Subject)`
  - Refuses `INVALID_TRANSACTION`: Only the seller can confirm a payment reported by the buyer.

#### Queries

- `_private(subject: Subject, actor: Actor) : optional (terms: String, evidence: String)`
- `_get(subject: Subject) : optional (payer: Payer, payee: Payee, status: String)`

#### Instances

- `TransactionConfirming` — instance of `TransactionConfirming` — [Claimed application types](../design/types.md), line 28.
  - `Actor` is `Authenticating.Account` — [Claimed application types](../design/types.md), line 29.
  - `Payee` is `Authenticating.Account` — [Claimed application types](../design/types.md), line 31.
  - `Payer` is `Authenticating.Account` — [Claimed application types](../design/types.md), line 30.
  - `Subject` is `Listing.Listing` — [Claimed application types](../design/types.md), line 32.

## Views

_Views name reusable conditions. Multiple `where` blocks are alternatives._

### (buyer) may buy (listing)

Authored path: `Marketplace.Workflow.BuyerAllowed`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 9.

```view
(buyer) may buy (listing) — inputs (buyer, listing); outputs (); bindings ()
  where Listing._mayBuy (buyer, listing) has (allowed: true)
```

### (buyer) may not buy (listing)

Authored path: `Marketplace.Workflow.BuyerDenied`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 9.

```view
(buyer) may not buy (listing) — inputs (buyer, listing); outputs (); bindings ()
  where Listing._mayBuy (buyer, listing) has (allowed: false)
```

### listing edits are closed

Authored path: `Marketplace.Workflow.EditingBlocked`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 49.

```view
listing edits are closed — inputs (listing); outputs (); bindings ()
  where Claiming._get (resource: listing) has (status: "completed")
  where TransactionConfirming._get (subject: listing) has (status: "awaitingConfirmation")
  where TransactionConfirming._get (subject: listing) has (status: "confirmed")
```

### private payment snapshot

Authored path: `Marketplace.Workflow.PaymentSnapshot`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 47.

```view
private payment snapshot — inputs (user, listing); outputs (terms, evidence, details); bindings () — answers at most one (terms, evidence, details)
  where
    TransactionConfirming._private (actor: user, subject: listing) has (evidence, terms)
    Listing._get (listing) has (details)
```

## Formers

_Formers name result shapes evaluated when asked. The source former owns_
_the authored explanation; this section records the generated shape._

### my conversation summaries

Authored path: `Messages.Conversations.ConversationList`.
- Covered by [Messages](../design/compositions/Messages.md), line 11.

```former
Former "my conversation summaries" — inputs (user); bindings (listing, buyer, seller, message, text, sentAt); promises exactly one record — forms:
  a record of
    conversations: each Messaging._conversations (actor: user) has (buyer, message, seller, sentAt, subject: listing, text)
      form a record of
        buyer
        listing
        message
        seller
        sentAt
        text
```

### my messages

Authored path: `Messages.Conversations.Inbox`.
- Covered by [Messages](../design/compositions/Messages.md), line 2.

```former
Former "my messages" — inputs (user); bindings (message, listing, buyer, seller, sender, text, sentAt); promises exactly one record — forms:
  a record of
    messages: each Messaging._inbox (actor: user) has (buyer, message, seller, sender, sentAt, subject: listing, text)
      form a record of
        buyer
        listing
        message
        seller
        sender
        sentAt
        text
```

### my offers

Authored path: `Marketplace.Workflow.Offers`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 41.

```former
Former "my offers" — inputs (user); bindings (offer, buyer, seller, listing, terms, status); promises exactly one record — forms:
  a record of
    offers: each Negotiating._inbox (actor: user) has (buyer, offer, seller, status, subject: listing, terms)
      form a record of
        buyer
        listing
        offer
        seller
        status
        terms
```

### paged private conversation history

Authored path: `Messages.Conversations.HistoryMessages`.
- Covered by [Messages](../design/compositions/Messages.md), line 13.

```former
Former "paged private conversation history" — inputs (user, listing, buyer, before); bindings (message, seller, sender, text, sentAt); promises exactly one record — forms:
  a record of
    messages: each Messaging._history (actor: user, before, buyer, subject: listing) has (message, seller, sender, sentAt, text)
      form a record of
        buyer
        listing
        message
        seller
        sender
        sentAt
        text
```

### private conversation history

Authored path: `Messages.Conversations.ThreadMessages`.
- Covered by [Messages](../design/compositions/Messages.md), line 11.

```former
Former "private conversation history" — inputs (user, listing, buyer); bindings (message, seller, sender, text, sentAt); promises exactly one record — forms:
  a record of
    messages: each Messaging._thread (actor: user, buyer, subject: listing) has (message, seller, sender, sentAt, text)
      form a record of
        buyer
        listing
        message
        seller
        sender
        sentAt
        text
```

### private transaction details

Authored path: `Marketplace.Workflow.PrivateTransaction`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 43.

```former
Former "private transaction details" — inputs (user, listing); bindings (terms, evidence, details); promises exactly one record — forms:
  a record of
    payment: a record of
      where whether view "private payment snapshot" with (listing, user) has (details, evidence, terms)
      details
      evidence
      terms
```

### public listing offers

Authored path: `Marketplace.Workflow.ListingOffers`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 51.

```former
Former "public listing offers" — inputs (listing); bindings (offer, buyer, seller, terms, status); promises exactly one record — forms:
  a record of
    offers: each Negotiating._public (subject: listing) has (buyer, offer, seller, status, terms)
      form a record of
        buyer
        listing
        offer
        seller
        status
        terms
```

### the marketplace

Authored path: `Marketplace.Workflow.Marketplace`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 11.

```former
Former "the marketplace" — inputs (user); bindings (listing, seller, details, status, claimer, paymentStatus, payer, payee); promises exactly one record — forms:
  a record of
    listings: each Listing._visible (reader: user) has (details, listing, seller)
      where no Claiming._get (resource: listing) has (status: "removed")
      form a record of
        claim: a record of
          where Claiming._get (resource: listing) has (claimer, status)
          claimer
          status
        details
        listing
        seller
        transaction: a record of
          where whether TransactionConfirming._get (subject: listing) has (payee, payer, status: paymentStatus)
          payee
          payer
          status: paymentStatus
```

### the public marketplace

Authored path: `Marketplace.Workflow.PublicMarketplace`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 36.

```former
Former "the public marketplace" — inputs (); bindings (listing, seller, details, status); promises exactly one record — forms:
  a record of
    listings: each Listing._publicAll () has (details, listing, seller)
      where no Claiming._get (resource: listing) has (status: "completed")
      where no Claiming._get (resource: listing) has (status: "removed")
      form a record of
        claim: a record of
          where Claiming._get (resource: listing) has (status)
          status
        details
        listing
        seller
```

## Reactions

### DeliverFaultToAsker

```reaction
when any action is faulted, not asked by DeliverFaultToAsker
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respondFramework (error: "INTERNAL_ERROR", requestId)
```

### DeliverRefusalToAsker

```reaction
when any action is refused (message), except RequestBoundary
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respond (error: message, requestId)
```

### Images.Photos.Upload

Authored path: `Images.Photos.Upload`.
- Covered by [Images](../design/compositions/Images.md), line 3.
- Covered by [Images](../design/compositions/Images.md), line 6.

```reaction
when RequestBoundary.request (data, mime, path: "/images/upload", requestId, session)
then
  Sessioning.current (session)
```

### Images.Photos.Upload#2

Authored path: `Images.Photos.Upload`.
- Covered by [Images](../design/compositions/Images.md), line 3.
- Covered by [Images](../design/compositions/Images.md), line 6.

```reaction
when Sessioning.current (session), asked by Images.Photos.Upload
where
  earlier, RequestBoundary.request (data, mime, path: "/images/upload", requestId, session)
then
  ImageUploading.store (data, mime)
```

### Images.Photos.Upload#3

Authored path: `Images.Photos.Upload`.
- Covered by [Images](../design/compositions/Images.md), line 3.
- Covered by [Images](../design/compositions/Images.md), line 6.

```reaction
when ImageUploading.store (data, mime, image), asked by Images.Photos.Upload#2
where
  earlier, RequestBoundary.request (data, mime, path: "/images/upload", requestId, session)
then
  RequestBoundary.respond (image, requestId)
```

### Marketplace.Workflow.AcceptOffer

Authored path: `Marketplace.Workflow.AcceptOffer`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 32.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 41.

```reaction
when RequestBoundary.request (offer, path: "/marketplace/accept-offer", requestId, session)
then
  Sessioning.current (session)
```

### Marketplace.Workflow.AcceptOffer#2

Authored path: `Marketplace.Workflow.AcceptOffer`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 32.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 41.

```reaction
when Sessioning.current (session, subject: user), asked by Marketplace.Workflow.AcceptOffer
where
  earlier, RequestBoundary.request (offer, path: "/marketplace/accept-offer", requestId, session)
then
  Negotiating.select (actor: user, offer)
```

### Marketplace.Workflow.AcceptOffer#3

Authored path: `Marketplace.Workflow.AcceptOffer`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 32.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 41.

```reaction
when Negotiating.select (actor: user, offer, buyer, subject: listing, terms), asked by Marketplace.Workflow.AcceptOffer#2
then
  Claiming.reserve (claimer: buyer, resource: listing, terms)
```

### Marketplace.Workflow.AcceptOffer#4

Authored path: `Marketplace.Workflow.AcceptOffer`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 32.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 41.

```reaction
when Claiming.reserve (claimer: buyer, resource: listing, terms), asked by Marketplace.Workflow.AcceptOffer#3
where
  earlier, RequestBoundary.request (offer, path: "/marketplace/accept-offer", requestId, session)
then
  RequestBoundary.respond (listing, requestId)
```

### Marketplace.Workflow.Activity

Authored path: `Marketplace.Workflow.Activity`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 18.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 36.

```reaction
when RequestBoundary.request (path: "/marketplace/activity", requestId, session)
then
  Sessioning.current (session)
```

### Marketplace.Workflow.Activity#2

Authored path: `Marketplace.Workflow.Activity`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 18.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 36.

```reaction
when Sessioning.current (session, subject: user), asked by Marketplace.Workflow.Activity
where
  earlier, RequestBoundary.request (path: "/marketplace/activity", requestId, session)
then
  RequestBoundary.respond (marketplace: former "the marketplace" with (user), requestId)
```

### Marketplace.Workflow.Browse

Authored path: `Marketplace.Workflow.Browse`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 13.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 19.

```reaction
when RequestBoundary.request (path: "/marketplace/list", requestId)
then
  RequestBoundary.respond (marketplace: former "the public marketplace", requestId)
```

### Marketplace.Workflow.Cancel

Authored path: `Marketplace.Workflow.Cancel`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 15.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 26.

```reaction
when RequestBoundary.request (listing, path: "/marketplace/cancel", requestId, session)
then
  Sessioning.current (session)
```

### Marketplace.Workflow.Cancel#2

Authored path: `Marketplace.Workflow.Cancel`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 15.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 26.

```reaction
when Sessioning.current (session, subject: user), asked by Marketplace.Workflow.Cancel
where
  earlier, RequestBoundary.request (listing, path: "/marketplace/cancel", requestId, session)
then
  TransactionConfirming.cancel (actor: user, subject: listing)
```

### Marketplace.Workflow.Cancel#3

Authored path: `Marketplace.Workflow.Cancel`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 15.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 26.

```reaction
when TransactionConfirming.cancel (actor: user, subject: listing), asked by Marketplace.Workflow.Cancel#2
where
  earlier, RequestBoundary.request (listing, path: "/marketplace/cancel", requestId, session)
then
  RequestBoundary.respond (listing, requestId)
```

### Marketplace.Workflow.Claim

Authored path: `Marketplace.Workflow.Claim`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 13.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 23.

```reaction
when RequestBoundary.request (listing, path: "/marketplace/claim", requestId, session)
then
  Sessioning.current (session)
```

### Marketplace.Workflow.Claim:allowed#2

Authored path: `Marketplace.Workflow.Claim`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 13.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 23.

```reaction
when Sessioning.current (session, subject: user), asked by Marketplace.Workflow.Claim
where
  earlier, RequestBoundary.request (listing, path: "/marketplace/claim", requestId, session)
  view "(buyer) may buy (listing)" with (buyer: user, listing)
then
  Listing.quote (amount: "", buyer: user, listing)
```

### Marketplace.Workflow.Claim:allowed#3

Authored path: `Marketplace.Workflow.Claim`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 13.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 23.

```reaction
when Listing.quote (amount: "", buyer: user, listing, seller, terms), asked by Marketplace.Workflow.Claim:allowed#2
then
  Claiming.reserve (claimer: user, resource: listing, terms)
```

### Marketplace.Workflow.Claim:allowed#4

Authored path: `Marketplace.Workflow.Claim`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 13.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 23.

```reaction
when Claiming.reserve (claimer: user, resource: listing, terms), asked by Marketplace.Workflow.Claim:allowed#3
where
  earlier, RequestBoundary.request (listing, path: "/marketplace/claim", requestId, session)
then
  RequestBoundary.respond (listing, requestId)
```

### Marketplace.Workflow.Claim:denied#2

Authored path: `Marketplace.Workflow.Claim`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 13.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 23.

```reaction
when Sessioning.current (session, subject: user), asked by Marketplace.Workflow.Claim
where
  earlier, RequestBoundary.request (listing, path: "/marketplace/claim", requestId, session)
  view "(buyer) may not buy (listing)" with (buyer: user, listing)
then
  RequestBoundary.respond (error: "CANNOT_BUY", requestId)
```

### Marketplace.Workflow.CloseOffers

Authored path: `Marketplace.Workflow.CloseOffers`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 45.

```reaction
when Claiming.reserve (claimer: buyer, resource: listing, terms)
then
  Negotiating.close (buyer, subject: listing, terms)
```

### Marketplace.Workflow.CompleteClaim

Authored path: `Marketplace.Workflow.CompleteClaim`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 7.

```reaction
when TransactionConfirming.confirmReceived (subject: listing)
where
  Claiming._get (resource: listing) has (claimer: buyer)
then
  Claiming.complete (claimer: buyer, resource: listing)
```

### Marketplace.Workflow.Confirm

Authored path: `Marketplace.Workflow.Confirm`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 13.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 25.

```reaction
when RequestBoundary.request (listing, path: "/marketplace/confirm", requestId, session)
then
  Sessioning.current (session)
```

### Marketplace.Workflow.Confirm#2

Authored path: `Marketplace.Workflow.Confirm`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 13.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 25.

```reaction
when Sessioning.current (session, subject: user), asked by Marketplace.Workflow.Confirm
where
  earlier, RequestBoundary.request (listing, path: "/marketplace/confirm", requestId, session)
then
  TransactionConfirming.confirmReceived (payee: user, subject: listing)
```

### Marketplace.Workflow.Confirm#3

Authored path: `Marketplace.Workflow.Confirm`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 13.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 25.

```reaction
when TransactionConfirming.confirmReceived (payee: user, subject: listing), asked by Marketplace.Workflow.Confirm#2
where
  earlier, RequestBoundary.request (listing, path: "/marketplace/confirm", requestId, session)
then
  RequestBoundary.respond (listing, requestId)
```

### Marketplace.Workflow.Edit

Authored path: `Marketplace.Workflow.Edit`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 21.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 39.

```reaction
when RequestBoundary.request (details, listing, path: "/marketplace/edit", previous, requestId, session)
then
  Sessioning.current (session)
```

### Marketplace.Workflow.Edit:editable#2

Authored path: `Marketplace.Workflow.Edit`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 21.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 39.

```reaction
when Sessioning.current (session, subject: user), asked by Marketplace.Workflow.Edit
where
  earlier, RequestBoundary.request (details, listing, path: "/marketplace/edit", previous, requestId, session)
  no view "listing edits are closed" with (listing)
then
  Listing.update (details, listing, previous, seller: user)
```

### Marketplace.Workflow.Edit:editable#3

Authored path: `Marketplace.Workflow.Edit`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 21.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 39.

```reaction
when Listing.update (details, listing, previous, seller: user), asked by Marketplace.Workflow.Edit:editable#2
where
  earlier, RequestBoundary.request (details, listing, path: "/marketplace/edit", previous, requestId, session)
then
  RequestBoundary.respond (listing, requestId)
```

### Marketplace.Workflow.Edit:locked#2

Authored path: `Marketplace.Workflow.Edit`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 21.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 39.

```reaction
when Sessioning.current (session, subject: user), asked by Marketplace.Workflow.Edit
where
  earlier, RequestBoundary.request (details, listing, path: "/marketplace/edit", previous, requestId, session)
  view "listing edits are closed" with (listing)
then
  RequestBoundary.respond (error: "LISTING_LOCKED", requestId)
```

### Marketplace.Workflow.FreezeReported

Authored path: `Marketplace.Workflow.FreezeReported`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 49.

```reaction
when TransactionConfirming.report (subject: listing)
then
  Listing.freeze (listing)
```

### Marketplace.Workflow.FreezeReportedLegacy

Authored path: `Marketplace.Workflow.FreezeReportedLegacy`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 49.

```reaction
when TransactionConfirming.reportPaid (subject: listing)
then
  Listing.freeze (listing)
```

### Marketplace.Workflow.MakeAvailable

Authored path: `Marketplace.Workflow.MakeAvailable`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 7.

```reaction
when Listing.create (listing)
then
  Claiming.makeAvailable (resource: listing)
```

### Marketplace.Workflow.OfferList

Authored path: `Marketplace.Workflow.OfferList`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 29.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 41.

```reaction
when RequestBoundary.request (path: "/marketplace/offers", requestId, session)
then
  Sessioning.current (session)
```

### Marketplace.Workflow.OfferList#2

Authored path: `Marketplace.Workflow.OfferList`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 29.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 41.

```reaction
when Sessioning.current (session, subject: user), asked by Marketplace.Workflow.OfferList
where
  earlier, RequestBoundary.request (path: "/marketplace/offers", requestId, session)
then
  RequestBoundary.respond (inbox: former "my offers" with (user), requestId)
```

### Marketplace.Workflow.Payment

Authored path: `Marketplace.Workflow.Payment`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 28.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 43.

```reaction
when RequestBoundary.request (listing, path: "/marketplace/payment", requestId, session)
then
  Sessioning.current (session)
```

### Marketplace.Workflow.Payment#2

Authored path: `Marketplace.Workflow.Payment`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 28.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 43.

```reaction
when Sessioning.current (session, subject: user), asked by Marketplace.Workflow.Payment
where
  earlier, RequestBoundary.request (listing, path: "/marketplace/payment", requestId, session)
then
  RequestBoundary.respond (requestId, transaction: former "private transaction details" with (listing, user))
```

### Marketplace.Workflow.Propose

Authored path: `Marketplace.Workflow.Propose`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 31.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 41.

```reaction
when RequestBoundary.request (amount, listing, path: "/marketplace/offer", requestId, session)
then
  Sessioning.current (session)
```

### Marketplace.Workflow.Propose#2

Authored path: `Marketplace.Workflow.Propose`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 31.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 41.

```reaction
when Sessioning.current (session, subject: user), asked by Marketplace.Workflow.Propose
where
  earlier, RequestBoundary.request (amount, listing, path: "/marketplace/offer", requestId, session)
then
  Claiming.checkAvailable (resource: listing)
```

### Marketplace.Workflow.Propose#3

Authored path: `Marketplace.Workflow.Propose`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 31.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 41.

```reaction
when Claiming.checkAvailable (resource: listing), asked by Marketplace.Workflow.Propose#2
where
  earlier, Sessioning.current (session, subject: user), asked by Marketplace.Workflow.Propose
  earlier, RequestBoundary.request (amount, listing, path: "/marketplace/offer", requestId, session)
then
  Listing.quote (amount, buyer: user, listing)
```

### Marketplace.Workflow.Propose#4

Authored path: `Marketplace.Workflow.Propose`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 31.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 41.

```reaction
when Listing.quote (amount, buyer: user, listing, seller, terms), asked by Marketplace.Workflow.Propose#3
then
  Negotiating.propose (buyer: user, seller, subject: listing, terms)
```

### Marketplace.Workflow.Propose#5

Authored path: `Marketplace.Workflow.Propose`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 31.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 41.

```reaction
when Negotiating.propose (buyer: user, seller, subject: listing, terms, offer), asked by Marketplace.Workflow.Propose#4
where
  earlier, RequestBoundary.request (amount, listing, path: "/marketplace/offer", requestId, session)
then
  RequestBoundary.respond (offer, requestId)
```

### Marketplace.Workflow.PublicOffers

Authored path: `Marketplace.Workflow.PublicOffers`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 30.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 51.

```reaction
when RequestBoundary.request (listing, path: "/marketplace/listing-offers", requestId)
then
  RequestBoundary.respond (inbox: former "public listing offers" with (listing), requestId)
```

### Marketplace.Workflow.Publish

Authored path: `Marketplace.Workflow.Publish`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 13.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 20.

```reaction
when RequestBoundary.request (details, path: "/marketplace/publish", requestId, session)
then
  Sessioning.current (session)
```

### Marketplace.Workflow.Publish#2

Authored path: `Marketplace.Workflow.Publish`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 13.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 20.

```reaction
when Sessioning.current (session, subject: user), asked by Marketplace.Workflow.Publish
where
  earlier, RequestBoundary.request (details, path: "/marketplace/publish", requestId, session)
then
  Listing.create (details, seller: user)
```

### Marketplace.Workflow.Publish#3

Authored path: `Marketplace.Workflow.Publish`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 13.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 20.

```reaction
when Listing.create (details, seller: user, listing), asked by Marketplace.Workflow.Publish#2
where
  earlier, RequestBoundary.request (details, path: "/marketplace/publish", requestId, session)
then
  RequestBoundary.respond (listing, requestId)
```

### Marketplace.Workflow.ReleaseCancelled

Authored path: `Marketplace.Workflow.ReleaseCancelled`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 15.

```reaction
when TransactionConfirming.cancel (subject: listing, payer: buyer)
then
  Claiming.release (claimer: buyer, resource: listing)
```

### Marketplace.Workflow.Remove

Authored path: `Marketplace.Workflow.Remove`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 22.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 53.

```reaction
when RequestBoundary.request (listing, path: "/marketplace/remove", requestId, session)
then
  Sessioning.current (session)
```

### Marketplace.Workflow.Remove#2

Authored path: `Marketplace.Workflow.Remove`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 22.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 53.

```reaction
when Sessioning.current (session, subject: user), asked by Marketplace.Workflow.Remove
where
  earlier, RequestBoundary.request (listing, path: "/marketplace/remove", requestId, session)
then
  Listing.authorizeRemoval (listing, seller: user)
```

### Marketplace.Workflow.Remove#3

Authored path: `Marketplace.Workflow.Remove`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 22.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 53.

```reaction
when Listing.authorizeRemoval (listing, seller: user), asked by Marketplace.Workflow.Remove#2
then
  Claiming.remove (resource: listing)
```

### Marketplace.Workflow.Remove#4

Authored path: `Marketplace.Workflow.Remove`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 22.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 53.

```reaction
when Claiming.remove (resource: listing), asked by Marketplace.Workflow.Remove#3
where
  earlier, RequestBoundary.request (listing, path: "/marketplace/remove", requestId, session)
then
  RequestBoundary.respond (listing, requestId)
```

### Marketplace.Workflow.ReportEvidence

Authored path: `Marketplace.Workflow.ReportEvidence`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 27.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 43.

```reaction
when RequestBoundary.request (data, listing, mime, path: "/marketplace/report-evidence", requestId, session)
then
  Sessioning.current (session)
```

### Marketplace.Workflow.ReportEvidence#2

Authored path: `Marketplace.Workflow.ReportEvidence`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 27.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 43.

```reaction
when Sessioning.current (session, subject: user), asked by Marketplace.Workflow.ReportEvidence
where
  earlier, RequestBoundary.request (data, listing, mime, path: "/marketplace/report-evidence", requestId, session)
then
  TransactionConfirming.report (data, mime, payer: user, subject: listing)
```

### Marketplace.Workflow.ReportEvidence#3

Authored path: `Marketplace.Workflow.ReportEvidence`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 27.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 43.

```reaction
when TransactionConfirming.report (data, mime, payer: user, subject: listing), asked by Marketplace.Workflow.ReportEvidence#2
where
  earlier, RequestBoundary.request (data, listing, mime, path: "/marketplace/report-evidence", requestId, session)
then
  RequestBoundary.respond (listing, requestId)
```

### Marketplace.Workflow.ReportPaid

Authored path: `Marketplace.Workflow.ReportPaid`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 13.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 24.

```reaction
when RequestBoundary.request (listing, path: "/marketplace/report-paid", requestId, session)
then
  Sessioning.current (session)
```

### Marketplace.Workflow.ReportPaid#2

Authored path: `Marketplace.Workflow.ReportPaid`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 13.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 24.

```reaction
when Sessioning.current (session, subject: user), asked by Marketplace.Workflow.ReportPaid
where
  earlier, RequestBoundary.request (listing, path: "/marketplace/report-paid", requestId, session)
then
  TransactionConfirming.reportPaid (payer: user, subject: listing)
```

### Marketplace.Workflow.ReportPaid#3

Authored path: `Marketplace.Workflow.ReportPaid`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 13.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 24.

```reaction
when TransactionConfirming.reportPaid (payer: user, subject: listing), asked by Marketplace.Workflow.ReportPaid#2
where
  earlier, RequestBoundary.request (listing, path: "/marketplace/report-paid", requestId, session)
then
  RequestBoundary.respond (listing, requestId)
```

### Marketplace.Workflow.ResolveOffer

Authored path: `Marketplace.Workflow.ResolveOffer`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 33.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 41.

```reaction
when RequestBoundary.request (decision, offer, path: "/marketplace/resolve-offer", requestId, session)
then
  Sessioning.current (session)
```

### Marketplace.Workflow.ResolveOffer#2

Authored path: `Marketplace.Workflow.ResolveOffer`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 33.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 41.

```reaction
when Sessioning.current (session, subject: user), asked by Marketplace.Workflow.ResolveOffer
where
  earlier, RequestBoundary.request (decision, offer, path: "/marketplace/resolve-offer", requestId, session)
then
  Negotiating.resolve (actor: user, decision, offer)
```

### Marketplace.Workflow.ResolveOffer#3

Authored path: `Marketplace.Workflow.ResolveOffer`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 33.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 41.

```reaction
when Negotiating.resolve (actor: user, decision, offer), asked by Marketplace.Workflow.ResolveOffer#2
where
  earlier, RequestBoundary.request (decision, offer, path: "/marketplace/resolve-offer", requestId, session)
then
  RequestBoundary.respond (offer, requestId)
```

### Marketplace.Workflow.StartTransaction

Authored path: `Marketplace.Workflow.StartTransaction`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 7.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 41.

```reaction
when Claiming.reserve (claimer: buyer, resource: listing, terms)
where
  Listing._get (listing) has (seller)
then
  TransactionConfirming.startWithTerms (payee: seller, payer: buyer, subject: listing, terms)
```

### Messages.Conversations.Conversations

Authored path: `Messages.Conversations.Conversations`.
- Covered by [Messages](../design/compositions/Messages.md), line 6.
- Covered by [Messages](../design/compositions/Messages.md), line 11.

```reaction
when RequestBoundary.request (path: "/messages/conversations", requestId, session)
then
  Sessioning.current (session)
```

### Messages.Conversations.Conversations#2

Authored path: `Messages.Conversations.Conversations`.
- Covered by [Messages](../design/compositions/Messages.md), line 6.
- Covered by [Messages](../design/compositions/Messages.md), line 11.

```reaction
when Sessioning.current (session, subject: user), asked by Messages.Conversations.Conversations
where
  earlier, RequestBoundary.request (path: "/messages/conversations", requestId, session)
then
  RequestBoundary.respond (inbox: former "my conversation summaries" with (user), requestId)
```

### Messages.Conversations.History

Authored path: `Messages.Conversations.History`.
- Covered by [Messages](../design/compositions/Messages.md), line 8.
- Covered by [Messages](../design/compositions/Messages.md), line 13.

```reaction
when RequestBoundary.request (before, buyer, listing, path: "/messages/history", requestId, session)
then
  Sessioning.current (session)
```

### Messages.Conversations.History#2

Authored path: `Messages.Conversations.History`.
- Covered by [Messages](../design/compositions/Messages.md), line 8.
- Covered by [Messages](../design/compositions/Messages.md), line 13.

```reaction
when Sessioning.current (session, subject: user), asked by Messages.Conversations.History
where
  earlier, RequestBoundary.request (before, buyer, listing, path: "/messages/history", requestId, session)
then
  RequestBoundary.respond (conversation: former "paged private conversation history" with (before, buyer, listing, user), requestId)
```

### Messages.Conversations.List

Authored path: `Messages.Conversations.List`.
- Covered by [Messages](../design/compositions/Messages.md), line 2.
- Covered by [Messages](../design/compositions/Messages.md), line 4.

```reaction
when RequestBoundary.request (path: "/messages/list", requestId, session)
then
  Sessioning.current (session)
```

### Messages.Conversations.List#2

Authored path: `Messages.Conversations.List`.
- Covered by [Messages](../design/compositions/Messages.md), line 2.
- Covered by [Messages](../design/compositions/Messages.md), line 4.

```reaction
when Sessioning.current (session, subject: user), asked by Messages.Conversations.List
where
  earlier, RequestBoundary.request (path: "/messages/list", requestId, session)
then
  RequestBoundary.respond (inbox: former "my messages" with (user), requestId)
```

### Messages.Conversations.Send

Authored path: `Messages.Conversations.Send`.
- Covered by [Messages](../design/compositions/Messages.md), line 2.
- Covered by [Messages](../design/compositions/Messages.md), line 5.

```reaction
when RequestBoundary.request (buyer, listing, path: "/messages/send", requestId, session, text)
then
  Sessioning.current (session)
```

### Messages.Conversations.Send#2

Authored path: `Messages.Conversations.Send`.
- Covered by [Messages](../design/compositions/Messages.md), line 2.
- Covered by [Messages](../design/compositions/Messages.md), line 5.

```reaction
when Sessioning.current (session, subject: user), asked by Messages.Conversations.Send
where
  earlier, RequestBoundary.request (buyer, listing, path: "/messages/send", requestId, session, text)
then
  Listing.owner (listing)
```

### Messages.Conversations.Send#3

Authored path: `Messages.Conversations.Send`.
- Covered by [Messages](../design/compositions/Messages.md), line 2.
- Covered by [Messages](../design/compositions/Messages.md), line 5.

```reaction
when Listing.owner (listing, seller), asked by Messages.Conversations.Send#2
where
  earlier, Sessioning.current (session, subject: user), asked by Messages.Conversations.Send
  earlier, RequestBoundary.request (buyer, listing, path: "/messages/send", requestId, session, text)
then
  Messaging.send (actor: user, buyer, seller, subject: listing, text)
```

### Messages.Conversations.Send#4

Authored path: `Messages.Conversations.Send`.
- Covered by [Messages](../design/compositions/Messages.md), line 2.
- Covered by [Messages](../design/compositions/Messages.md), line 5.

```reaction
when Messaging.send (actor: user, buyer, seller, subject: listing, text, message), asked by Messages.Conversations.Send#3
where
  earlier, RequestBoundary.request (buyer, listing, path: "/messages/send", requestId, session, text)
then
  RequestBoundary.respond (message, requestId)
```

### Messages.Conversations.Thread

Authored path: `Messages.Conversations.Thread`.
- Covered by [Messages](../design/compositions/Messages.md), line 7.
- Covered by [Messages](../design/compositions/Messages.md), line 11.

```reaction
when RequestBoundary.request (buyer, listing, path: "/messages/thread", requestId, session)
then
  Sessioning.current (session)
```

### Messages.Conversations.Thread#2

Authored path: `Messages.Conversations.Thread`.
- Covered by [Messages](../design/compositions/Messages.md), line 7.
- Covered by [Messages](../design/compositions/Messages.md), line 11.

```reaction
when Sessioning.current (session, subject: user), asked by Messages.Conversations.Thread
where
  earlier, RequestBoundary.request (buyer, listing, path: "/messages/thread", requestId, session)
then
  RequestBoundary.respond (conversation: former "private conversation history" with (buyer, listing, user), requestId)
```

### Sessions.CurrentAccount.CurrentUser

Authored path: `Sessions.CurrentAccount.CurrentUser`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 17.
- Covered by [Sessions](../design/compositions/Sessions.md), line 22.

```reaction
when RequestBoundary.request (path: "/auth/current", requestId, session)
then
  Sessioning.current (session)
```

### Sessions.CurrentAccount.CurrentUser#2

Authored path: `Sessions.CurrentAccount.CurrentUser`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 17.
- Covered by [Sessions](../design/compositions/Sessions.md), line 22.

```reaction
when Sessioning.current (session, subject: username), asked by Sessions.CurrentAccount.CurrentUser
where
  earlier, RequestBoundary.request (path: "/auth/current", requestId, session)
then
  RequestBoundary.respond (requestId, username)
```

### Sessions.EnteringApplication.Register

Authored path: `Sessions.EnteringApplication.Register`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 6.
- Covered by [Sessions](../design/compositions/Sessions.md), line 13.

```reaction
when RequestBoundary.request (password, path: "/auth/register", requestId, username)
then
  Authenticating.register (password, username)
```

### Sessions.EnteringApplication.Register#2

Authored path: `Sessions.EnteringApplication.Register`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 6.
- Covered by [Sessions](../design/compositions/Sessions.md), line 13.

```reaction
when Authenticating.register (password, username, account), asked by Sessions.EnteringApplication.Register
then
  Sessioning.start (subject: account)
```

### Sessions.EnteringApplication.Register#3

Authored path: `Sessions.EnteringApplication.Register`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 6.
- Covered by [Sessions](../design/compositions/Sessions.md), line 13.

```reaction
when Sessioning.start (subject: account, expiresAt, session), asked by Sessions.EnteringApplication.Register#2
where
  earlier, RequestBoundary.request (password, path: "/auth/register", requestId, username)
then
  RequestBoundary.respond (account, expiresAt, requestId, session)
```

### Sessions.EnteringApplication.SignIn

Authored path: `Sessions.EnteringApplication.SignIn`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 8.
- Covered by [Sessions](../design/compositions/Sessions.md), line 14.

```reaction
when RequestBoundary.request (password, path: "/auth/sign-in", requestId, username)
then
  Authenticating.authenticate (password, username)
```

### Sessions.EnteringApplication.SignIn#2

Authored path: `Sessions.EnteringApplication.SignIn`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 8.
- Covered by [Sessions](../design/compositions/Sessions.md), line 14.

```reaction
when Authenticating.authenticate (password, username, account), asked by Sessions.EnteringApplication.SignIn
then
  Sessioning.start (subject: account)
```

### Sessions.EnteringApplication.SignIn#3

Authored path: `Sessions.EnteringApplication.SignIn`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 8.
- Covered by [Sessions](../design/compositions/Sessions.md), line 14.

```reaction
when Sessioning.start (subject: account, expiresAt, session), asked by Sessions.EnteringApplication.SignIn#2
where
  earlier, RequestBoundary.request (password, path: "/auth/sign-in", requestId, username)
then
  RequestBoundary.respond (account, expiresAt, requestId, session)
```

### Sessions.LeavingApplication.SignOut

Authored path: `Sessions.LeavingApplication.SignOut`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 25.
- Covered by [Sessions](../design/compositions/Sessions.md), line 30.

```reaction
when RequestBoundary.request (path: "/auth/sign-out", requestId, session)
then
  Sessioning.end (session)
```

### Sessions.LeavingApplication.SignOut#2

Authored path: `Sessions.LeavingApplication.SignOut`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 25.
- Covered by [Sessions](../design/compositions/Sessions.md), line 30.

```reaction
when Sessioning.end (session, ended: signedOut), asked by Sessions.LeavingApplication.SignOut
where
  earlier, RequestBoundary.request (path: "/auth/sign-out", requestId, session)
then
  RequestBoundary.respond (requestId, signedOut)
```

## Endpoint input contracts

Before recording an action ask, the boundary rejects a body that is not an
object or lacks a required key. The response uses `INVALID_INPUT` and names
the path or missing key. A declared default fills an absent key. Endpoints
not listed here have no explicit input contract.

- `/auth/current` — requires `session`
- `/auth/register` — requires `username`, `password`
- `/auth/sign-in` — requires `username`, `password`
- `/auth/sign-out` — requires `session`
- `/images/upload` — requires `session`, `data`, `mime`
- `/marketplace/accept-offer` — requires `session`, `offer`
- `/marketplace/activity` — requires `session`
- `/marketplace/cancel` — requires `session`, `listing`
- `/marketplace/claim` — requires `session`, `listing`
- `/marketplace/confirm` — requires `session`, `listing`
- `/marketplace/edit` — requires `session`, `listing`, `details`, `previous`
- `/marketplace/listing-offers` — requires `listing`
- `/marketplace/offer` — requires `session`, `listing`, `amount`
- `/marketplace/offers` — requires `session`
- `/marketplace/payment` — requires `session`, `listing`
- `/marketplace/publish` — requires `session`, `details`
- `/marketplace/remove` — requires `session`, `listing`
- `/marketplace/report-evidence` — requires `session`, `listing`, `data`, `mime`
- `/marketplace/report-paid` — requires `session`, `listing`
- `/marketplace/resolve-offer` — requires `session`, `offer`, `decision`
- `/messages/conversations` — requires `session`
- `/messages/history` — requires `session`, `listing`, `buyer`, `before`
- `/messages/list` — requires `session`
- `/messages/send` — requires `session`, `listing`, `buyer`, `text`
- `/messages/thread` — requires `session`, `listing`, `buyer`
