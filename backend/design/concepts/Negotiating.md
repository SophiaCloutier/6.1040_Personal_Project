# Negotiating
## Purpose
Let two parties propose and select a price for a subject.
## Principle
A buyer proposes terms to a seller. The buyer can withdraw a pending proposal; the seller can decline it or select its terms. Selection does not itself reserve anything. Composition passes selected terms to exclusive Claiming, whose successful reservation determines acceptance. Pending proposals never block full-price purchases. A withdrawal racing selection may occur after selection has already read the terms; it cannot undo a successful reservation.
## Types
```types
external Actor
  A participant identity.
external Subject
  An object being negotiated.
```
## State
```state
a set of Offers with
  a buyer Actor
  a seller Actor
  a subject Subject
  a terms String
  a status String
```
## Actions
```actions
propose (buyer: Actor, seller: Actor, subject: Subject, terms: String) : returns (offer: Offer)
  where buyer equals seller
  then
    refuses INVALID_OFFER "You cannot offer on your own listing."
  where buyer differs from seller
  then
    create a pending offer
    returns offer
resolve (actor: Actor, offer: Offer, decision: String) : returns (offer: Offer)
  where offer is not pending or actor cannot make decision
  then
    refuses INVALID_OFFER "Only the seller can decline and only the buyer can withdraw a pending offer."
  where decision is declined by seller or withdrawn by buyer
  then
    atomically set offer status to decision
    returns offer
close (subject: Subject, buyer: Actor, terms: String) : returns (subject: Subject)
  where true
  then
    mark the selected offer in terms accepted for buyer if present and mark other pending subject offers superseded
    returns subject
select (actor: Actor, offer: Offer) : returns (buyer: Actor, subject: Subject, terms: String)
  where actor is not seller of a pending offer
  then
    refuses INVALID_OFFER "Only the seller can select pending offer terms."
  where actor is seller of a pending offer
  then
    bind buyer, subject and terms tagged with offer identity
    returns buyer, subject, terms
```
## Queries
```queries
_inbox (actor: Actor) : many (offer: Offer, buyer: Actor, seller: Actor, subject: Subject, terms: String, status: String)
  answers only proposals where actor is buyer or seller
_public (subject: Subject) : many (offer: Offer, buyer: Actor, seller: Actor, subject: Subject, terms: String, status: String)
  answers all proposals for subject with terms containing only the offered price
```

