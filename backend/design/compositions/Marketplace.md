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
Marketplace.Workflow.Claim at /marketplace/claim
Marketplace.Workflow.ReportPaid at /marketplace/report-paid
Marketplace.Workflow.Confirm at /marketplace/confirm
Marketplace.Workflow.Cancel at /marketplace/cancel
```

[Public browsing](former:Marketplace.Workflow.PublicMarketplace) returns listing descriptions and availability without payment instructions, claimer identities, or transaction details. [Private activity](reaction:Marketplace.Workflow.Activity) requires authentication and returns the existing marketplace state for the signed-in experience. Listing metadata includes up to 12 normalized searchable tags of at most 40 characters, including seller-created tags. The UI combines keyword search, selected-tag matching, availability, and price filters.

