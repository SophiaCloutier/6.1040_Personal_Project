# Marketplace

Completed claims are omitted from the public marketplace, and the signed-in marketplace grid applies the same exclusion. Completed listings remain persisted and available in the buyer and seller activity history. Reserved and payment-reported listings remain visible with their current state until confirmation completes the claim.

Browsing is public; mutation endpoints and private activity resolve the account from its session. Buyers cannot choose another identity. Claiming atomically reserves each listing; payment reporting and confirmation enforce the payer and payee respectively.

[Creation](reaction:Marketplace.Workflow.MakeAvailable) makes a new listing available. [Claiming](reaction:Marketplace.Workflow.StartTransaction) starts a transaction using the listing instance and its seller. [Confirmation](reaction:Marketplace.Workflow.CompleteClaim) completes its claim.

[Purchase permission](view:Marketplace.Workflow.BuyerAllowed) requires an existing listing owned by another account. [Denial](view:Marketplace.Workflow.BuyerDenied) covers missing and self-owned listings.

[The marketplace](former:Marketplace.Workflow.Marketplace) combines listings, availability, and optional transaction status. Browser responses reflect current persisted state.

[Browse](reaction:Marketplace.Workflow.Browse) reads the marketplace for a signed-in user. [Publish](reaction:Marketplace.Workflow.Publish) creates a fixed-price listing attributed to that user. [Claim](reaction:Marketplace.Workflow.Claim) applies purchase permission and atomically reserves the item. [Report payment](reaction:Marketplace.Workflow.ReportPaid) records the payer's report. [Confirm receipt](reaction:Marketplace.Workflow.Confirm) records the payee's confirmation.

[Cancel](reaction:Marketplace.Workflow.Cancel) lets the buyer or seller cancel before reporting payment. Its atomic transaction deletion competes with payment reporting so both cannot succeed. [Release cancellation](reaction:Marketplace.Workflow.ReleaseCancelled) releases the original buyer's claim, making the item available again. A later claim starts a fresh transaction. Cancellation after reporting payment or after confirmation is refused.

```endpoints
Marketplace.Workflow.Activity at /marketplace/activity
Marketplace.Workflow.Browse at /marketplace/list
Marketplace.Workflow.Publish at /marketplace/publish
Marketplace.Workflow.Edit at /marketplace/edit
Marketplace.Workflow.Claim at /marketplace/claim
Marketplace.Workflow.ReportPaid at /marketplace/report-paid
Marketplace.Workflow.Confirm at /marketplace/confirm
Marketplace.Workflow.Cancel at /marketplace/cancel
Marketplace.Workflow.ReportEvidence at /marketplace/report-evidence
Marketplace.Workflow.Payment at /marketplace/payment
Marketplace.Workflow.OfferList at /marketplace/offers
Marketplace.Workflow.PublicOffers at /marketplace/listing-offers
Marketplace.Workflow.Propose at /marketplace/offer
Marketplace.Workflow.AcceptOffer at /marketplace/accept-offer
Marketplace.Workflow.ResolveOffer at /marketplace/resolve-offer
```

[Public browsing](former:Marketplace.Workflow.PublicMarketplace) returns listing descriptions and availability without payment instructions, claimer identities, or transaction details. [Private activity](reaction:Marketplace.Workflow.Activity) requires authentication and returns the existing marketplace state for the signed-in experience. Listing metadata includes up to 12 normalized searchable tags of at most 40 characters, including seller-created tags. The UI combines keyword search, selected-tag matching, availability, and price filters.


[Edit](reaction:Marketplace.Workflow.Edit) authenticates the seller and compares the previous saved details to prevent overwriting another edit. Edits change advertised details; reserved transaction terms are frozen separately.

[Offer inbox](former:Marketplace.Workflow.Offers) and [offer list](reaction:Marketplace.Workflow.OfferList) disclose offers only to their buyer or seller. [Propose](reaction:Marketplace.Workflow.Propose) obtains server-validated terms from an offer-enabled listing. [Accept](reaction:Marketplace.Workflow.AcceptOffer) selects seller-owned pending terms and atomically reserves the listing. The reservation's terms drive [transaction creation](reaction:Marketplace.Workflow.StartTransaction). Competing offers and fixed-price claims share the same atomic reservation. Unselected proposals remain nonbinding; their UI availability follows the listing status. [Resolve](reaction:Marketplace.Workflow.ResolveOffer) permits seller decline or buyer withdrawal.

[Payment](reaction:Marketplace.Workflow.Payment) uses [private transaction details](former:Marketplace.Workflow.PrivateTransaction) to disclose frozen terms and optional sanitized screenshot only to the payer/payee. [Report evidence](reaction:Marketplace.Workflow.ReportEvidence) validates the image before the atomic payment transition. Evidence is stored in MongoDB, never in the public uploads directory. Screenshots help reconcile payments; only seller confirmation completes a sale. Listing edits affect advertised details, never saved transaction terms.

[Close offers](reaction:Marketplace.Workflow.CloseOffers) records the winning proposal as accepted and supersedes other pending offers after an exclusive reservation succeeds. Cancelling the reservation does not revive old offers.

[Payment snapshot](view:Marketplace.Workflow.PaymentSnapshot) joins a participant-authorized transaction with its listing. Current details are available only inside that authorized join, to recover instructions for legacy reservations without saved terms. New reservations always use frozen terms.

[Editing blocked](view:Marketplace.Workflow.EditingBlocked) prevents edits once payment is reported or a claim is completed, including records created before this restriction. [Freeze report](reaction:Marketplace.Workflow.FreezeReported) and [freeze legacy report](reaction:Marketplace.Workflow.FreezeReportedLegacy) close Listing updates durably after successful payment reporting. Listing uses an atomic unlocked condition when updating. Failed reports do not freeze listings. Reserved but unpaid listings remain editable, with transaction terms frozen as before.

[Listing offer history](former:Marketplace.Workflow.ListingOffers) and [public offers](reaction:Marketplace.Workflow.PublicOffers) show all offers for a listing to every visitor, including signed-out visitors. Public terms contain only price; payment instructions remain private. Offer actions retain buyer and seller authorization.
