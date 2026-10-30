# TransactionConfirming
## Purpose
Record shared confirmation that an external payment occurred.
## Principle
A transaction starts awaiting payment, its payer reports payment (with evidence if required by the saved terms), then its payee confirms receipt. Before payment is reported, either party may cancel the transaction, allowing a new one for the same subject.
## Types

```types
external Payer
  An identity reporting payment.
external Payee
  An identity confirming receipt.
external Subject
  The subject of payment.
external Actor
  An identity asking to cancel a transaction; must equal its payer or payee.
```

## State
```state
a set of Transactions with
  a payer Payer
  a payee Payee
  a subject Subject
  a status String
  a terms String
  an evidence String
```
## Actions
```actions
startWithTerms (payer: Payer, payee: Payee, subject: Subject, terms: String) : returns (subject: Subject)
  where subject has a transaction
  then
    refuses INVALID_TRANSACTION "A transaction already exists."
  where subject has no transaction
  then
    create an awaitingPayment transaction with immutable terms and empty evidence
    returns subject
report (payer: Payer, subject: Subject, data: String, mime: String) : returns (subject: Subject)
  where image data is invalid
  then
    refuses INVALID_IMAGE "Choose a JPEG, PNG, or WebP up to 5 MB."
  where payer is not buyer of an unpaid transaction or required evidence is missing
  then
    refuses INVALID_TRANSACTION "Attach valid evidence to your unpaid transaction."
  where transaction belongs to payer and evidence satisfies its terms
  then
    sanitize any image and atomically change awaitingPayment or paymentRejected to awaitingConfirmation with private evidence
    returns subject
start (payer: Payer, payee: Payee, subject: Subject) : returns (subject: Subject)
  where subject already has a transaction
  then
    refuses INVALID_TRANSACTION "A transaction already exists for this item."
  where subject has no transaction
  then
    create a transaction awaitingPayment with payer and payee
    returns subject
reportPaid (payer: Payer, subject: Subject) : returns (subject: Subject)
  where subject is neither awaitingPayment nor paymentRejected for payer or saved terms require evidence
  then
    refuses INVALID_TRANSACTION "Only the buyer can report payment on an unpaid transaction."
  where subject is awaitingPayment or paymentRejected for payer and saved terms do not require evidence
  then
    set status to awaitingConfirmation
    returns subject
cancel (actor: Actor, subject: Subject) : returns (subject: Subject, payer: Payer)
  where subject is not awaitingPayment or actor is neither its payer nor payee
  then
    refuses CANCELLATION_UNAVAILABLE "Only the buyer or seller can cancel before payment is reported."
  where subject is awaitingPayment and actor is its payer or payee
  then
    atomically remove the transaction
    returns subject, payer
rejectPayment (payee: Payee, subject: Subject, decision: String) : returns (subject: Subject, payer: Payer, decision: String)
  where subject is not awaitingConfirmation for payee or decision is not retry or relist
  then
    refuses INVALID_TRANSACTION "Only the seller can reject a reported payment."
  where subject is awaitingConfirmation for payee and decision is retry or relist
  then
    atomically delete transaction for relist, or set paymentRejected and clear evidence for retry; preserve saved terms
    returns subject, payer, decision
confirmReceived (payee: Payee, subject: Subject) : returns (subject: Subject)
  where subject is not awaitingConfirmation for payee
  then
    refuses INVALID_TRANSACTION "Only the seller can confirm a payment reported by the buyer."
  where subject is awaitingConfirmation for payee
  then
    set status to confirmed
    returns subject
```
## Queries
```queries
_private (subject: Subject, actor: Actor) : optional (terms: String, evidence: String)
  answers saved terms and evidence only for payer or payee; legacy terms default to empty JSON
_get (subject: Subject) : optional (payer: Payer, payee: Payee, status: String)
  answers the transaction or no rows when missing
```
