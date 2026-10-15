# Claimed application types

Account usernames are the identity used as session subjects. Authentication proves the account; Sessioning owns its opaque, expiring sessions.

```instances
instantiate Authenticating

instantiate ImageUploading

instantiate Sessioning with
  Subject is Authenticating.Account

instantiate Listing with
  Seller is Authenticating.Account

instantiate Claiming with
  Claimer is Authenticating.Account
  Resource is Listing.Listing

instantiate TransactionConfirming with
  Actor is Authenticating.Account
  Payer is Authenticating.Account
  Payee is Authenticating.Account
  Subject is Listing.Listing
```
