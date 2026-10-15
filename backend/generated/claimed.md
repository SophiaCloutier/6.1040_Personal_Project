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

- `Authenticating` — instance of `Authenticating` — [Claimed application types](../design/types.md), line 6.

### Claiming

Defined in [Claiming](../design/concepts/Claiming.md), line 1.

#### Actions

- `makeAvailable(resource: Resource) : returns (resource: Resource)`
  - Refuses `CLAIM_UNAVAILABLE`: This item already has an availability record.
- `claim(claimer: Claimer, resource: Resource) : returns (resource: Resource)`
  - Refuses `CLAIM_UNAVAILABLE`: This item is no longer available.
- `release(claimer: Claimer, resource: Resource) : returns (resource: Resource)`
  - Refuses `CLAIM_UNAVAILABLE`: Only the current claimer can release a reserved item.
- `complete(claimer: Claimer, resource: Resource) : returns (resource: Resource)`
  - Refuses `CLAIM_UNAVAILABLE`: This claim cannot be completed.

#### Queries

- `_get(resource: Resource) : optional (status: String, claimer: Claimer)`

#### Instances

- `Claiming` — instance of `Claiming` — [Claimed application types](../design/types.md), line 16.
  - `Claimer` is `Authenticating.Account` — [Claimed application types](../design/types.md), line 17.
  - `Resource` is `Listing.Listing` — [Claimed application types](../design/types.md), line 18.

### ImageUploading

Defined in [ImageUploading](../design/concepts/ImageUploading.md), line 1.

#### Actions

- `store(data: String, mime: String) : returns (image: String)`
  - Refuses `INVALID_IMAGE`: Choose a valid JPEG, PNG, or WebP photo up to 5 MB.

#### Instances

- `ImageUploading` — instance of `ImageUploading` — [Claimed application types](../design/types.md), line 8.

### Listing

Defined in [Listing](../design/concepts/Listing.md), line 1.

#### Actions

- `create(seller: Seller, details: String) : returns (listing: Listing)`
  - Refuses `INVALID_LISTING`: Enter valid listing information.

#### Queries

- `_all() : many (listing: Listing, seller: Seller, details: String)`
- `_publicAll() : many (listing: Listing, seller: Seller, details: String)`
- `_get(listing: Listing) : optional (seller: Seller, details: String)`
- `_mayBuy(listing: Listing, buyer: Seller) : one (allowed: Flag)`

#### Instances

- `Listing` — instance of `Listing` — [Claimed application types](../design/types.md), line 13.
  - `Seller` is `Authenticating.Account` — [Claimed application types](../design/types.md), line 14.

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

- `Sessioning` — instance of `Sessioning` — [Claimed application types](../design/types.md), line 10.
  - `Subject` is `Authenticating.Account` — [Claimed application types](../design/types.md), line 11.

### TransactionConfirming

Defined in [TransactionConfirming](../design/concepts/TransactionConfirming.md), line 1.

#### Actions

- `start(payer: Payer, payee: Payee, subject: Subject) : returns (subject: Subject)`
  - Refuses `INVALID_TRANSACTION`: A transaction already exists for this item.
- `reportPaid(payer: Payer, subject: Subject) : returns (subject: Subject)`
  - Refuses `INVALID_TRANSACTION`: Only the buyer can report payment on an unpaid transaction.
- `cancel(actor: Actor, subject: Subject) : returns (subject: Subject, payer: Payer)`
  - Refuses `CANCELLATION_UNAVAILABLE`: Only the buyer or seller can cancel before payment is reported.
- `confirmReceived(payee: Payee, subject: Subject) : returns (subject: Subject)`
  - Refuses `INVALID_TRANSACTION`: Only the seller can confirm a payment reported by the buyer.

#### Queries

- `_get(subject: Subject) : optional (payer: Payer, payee: Payee, status: String)`

#### Instances

- `TransactionConfirming` — instance of `TransactionConfirming` — [Claimed application types](../design/types.md), line 20.
  - `Actor` is `Authenticating.Account` — [Claimed application types](../design/types.md), line 21.
  - `Payee` is `Authenticating.Account` — [Claimed application types](../design/types.md), line 23.
  - `Payer` is `Authenticating.Account` — [Claimed application types](../design/types.md), line 22.
  - `Subject` is `Listing.Listing` — [Claimed application types](../design/types.md), line 24.

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

## Formers

_Formers name result shapes evaluated when asked. The source former owns_
_the authored explanation; this section records the generated shape._

### the marketplace

Authored path: `Marketplace.Workflow.Marketplace`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 11.

```former
Former "the marketplace" — inputs (); bindings (listing, seller, details, status, claimer, paymentStatus, payer, payee); promises exactly one record — forms:
  a record of
    listings: each Listing._all () has (details, listing, seller)
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
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 27.

```former
Former "the public marketplace" — inputs (); bindings (listing, seller, details, status); promises exactly one record — forms:
  a record of
    listings: each Listing._publicAll () has (details, listing, seller)
      where no Claiming._get (resource: listing) has (status: "completed")
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

### Marketplace.Workflow.Activity

Authored path: `Marketplace.Workflow.Activity`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 18.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 27.

```reaction
when RequestBoundary.request (path: "/marketplace/activity", requestId, session)
then
  Sessioning.current (session)
```

### Marketplace.Workflow.Activity#2

Authored path: `Marketplace.Workflow.Activity`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 18.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 27.

```reaction
when Sessioning.current (session, subject: user), asked by Marketplace.Workflow.Activity
where
  earlier, RequestBoundary.request (path: "/marketplace/activity", requestId, session)
then
  RequestBoundary.respond (marketplace: former "the marketplace", requestId)
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
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 24.

```reaction
when RequestBoundary.request (listing, path: "/marketplace/cancel", requestId, session)
then
  Sessioning.current (session)
```

### Marketplace.Workflow.Cancel#2

Authored path: `Marketplace.Workflow.Cancel`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 15.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 24.

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
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 24.

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
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 21.

```reaction
when RequestBoundary.request (listing, path: "/marketplace/claim", requestId, session)
then
  Sessioning.current (session)
```

### Marketplace.Workflow.Claim:allowed#2

Authored path: `Marketplace.Workflow.Claim`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 13.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 21.

```reaction
when Sessioning.current (session, subject: user), asked by Marketplace.Workflow.Claim
where
  earlier, RequestBoundary.request (listing, path: "/marketplace/claim", requestId, session)
  view "(buyer) may buy (listing)" with (buyer: user, listing)
then
  Claiming.claim (claimer: user, resource: listing)
```

### Marketplace.Workflow.Claim:allowed#3

Authored path: `Marketplace.Workflow.Claim`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 13.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 21.

```reaction
when Claiming.claim (claimer: user, resource: listing), asked by Marketplace.Workflow.Claim:allowed#2
where
  earlier, RequestBoundary.request (listing, path: "/marketplace/claim", requestId, session)
then
  RequestBoundary.respond (listing, requestId)
```

### Marketplace.Workflow.Claim:denied#2

Authored path: `Marketplace.Workflow.Claim`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 13.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 21.

```reaction
when Sessioning.current (session, subject: user), asked by Marketplace.Workflow.Claim
where
  earlier, RequestBoundary.request (listing, path: "/marketplace/claim", requestId, session)
  view "(buyer) may not buy (listing)" with (buyer: user, listing)
then
  RequestBoundary.respond (error: "CANNOT_BUY", requestId)
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
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 23.

```reaction
when RequestBoundary.request (listing, path: "/marketplace/confirm", requestId, session)
then
  Sessioning.current (session)
```

### Marketplace.Workflow.Confirm#2

Authored path: `Marketplace.Workflow.Confirm`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 13.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 23.

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
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 23.

```reaction
when TransactionConfirming.confirmReceived (payee: user, subject: listing), asked by Marketplace.Workflow.Confirm#2
where
  earlier, RequestBoundary.request (listing, path: "/marketplace/confirm", requestId, session)
then
  RequestBoundary.respond (listing, requestId)
```

### Marketplace.Workflow.MakeAvailable

Authored path: `Marketplace.Workflow.MakeAvailable`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 7.

```reaction
when Listing.create (listing)
then
  Claiming.makeAvailable (resource: listing)
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

### Marketplace.Workflow.ReportPaid

Authored path: `Marketplace.Workflow.ReportPaid`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 13.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 22.

```reaction
when RequestBoundary.request (listing, path: "/marketplace/report-paid", requestId, session)
then
  Sessioning.current (session)
```

### Marketplace.Workflow.ReportPaid#2

Authored path: `Marketplace.Workflow.ReportPaid`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 13.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 22.

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
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 22.

```reaction
when TransactionConfirming.reportPaid (payer: user, subject: listing), asked by Marketplace.Workflow.ReportPaid#2
where
  earlier, RequestBoundary.request (listing, path: "/marketplace/report-paid", requestId, session)
then
  RequestBoundary.respond (listing, requestId)
```

### Marketplace.Workflow.StartTransaction

Authored path: `Marketplace.Workflow.StartTransaction`.
- Covered by [Marketplace](../design/compositions/Marketplace.md), line 7.

```reaction
when Claiming.claim (claimer: buyer, resource: listing)
where
  Listing._get (listing) has (seller)
then
  TransactionConfirming.start (payee: seller, payer: buyer, subject: listing)
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
- `/marketplace/activity` — requires `session`
- `/marketplace/cancel` — requires `session`, `listing`
- `/marketplace/claim` — requires `session`, `listing`
- `/marketplace/confirm` — requires `session`, `listing`
- `/marketplace/publish` — requires `session`, `details`
- `/marketplace/report-paid` — requires `session`, `listing`
