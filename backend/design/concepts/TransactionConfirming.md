# TransactionConfirming
## Purpose
Record shared confirmation that an external payment occurred.
## Principle
A transaction starts awaiting payment, its payer reports payment, then its payee confirms receipt. Before payment is reported, either party may cancel the transaction, allowing a new one for the same subject.
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
```
## Actions
```actions
start (payer: Payer, payee: Payee, subject: Subject) : returns (subject: Subject)
  where subject already has a transaction
  then
    refuses INVALID_TRANSACTION "A transaction already exists for this item."
  where subject has no transaction
  then
    create a transaction awaitingPayment with payer and payee
    returns subject
reportPaid (payer: Payer, subject: Subject) : returns (subject: Subject)
  where subject is not awaitingPayment for payer
  then
    refuses INVALID_TRANSACTION "Only the buyer can report payment on an unpaid transaction."
  where subject is awaitingPayment for payer
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
_get (subject: Subject) : optional (payer: Payer, payee: Payee, status: String)
  answers the transaction or no rows when missing
```



