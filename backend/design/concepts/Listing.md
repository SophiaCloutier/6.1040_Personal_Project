# Listing
## Purpose
Make items available for discovery with seller-supplied information.
## Principle
A seller creates a listing; readers discover its details. Descriptive tags may be chosen from suggestions or created by the seller. Tags are normalized, deduplicated, and limited to 12 per listing and 40 characters each. Optional clothing size is a string of at most 24 characters; standard names such as medium normalize to M, while numeric sizes retain their size-system prefix. Purchase policy can determine whether a buyer differs from its seller.
Listing details contain an ordered array of zero to five image URLs. The first image is the cover image. Legacy single-image input is normalized to a one-element array; malformed image URLs and more than five images are refused.

Photo framing:
Details also contain boolean `obo` and `requireProof` flags (both default false), and `imagePositions`, a map from each image URL to x/y percentages in [0,100] and zoom in [1,4]. Omitted zoom defaults to 1. Dragging and zooming affect cropped previews; the item gallery keeps the complete image visible.


## Types

```types
external Seller
  An identity that can sell items.
```

## State
```state
a set of Listings with
  a seller Seller
  a details String
  a locked Flag
```
## Actions
```actions
create (seller: Seller, details: String) : returns (listing: Listing)
  where details do not describe a valid item
  then
    refuses INVALID_LISTING "Enter valid listing information."
  where details are valid
  then
    create a fresh listing with seller and details
    returns listing
authorizeRemoval (seller: Seller, listing: Listing) : returns (listing: Listing)
  where listing is missing or belongs to another seller
  then
    refuses INVALID_LISTING "Only the seller can remove this listing."
  where seller owns listing
  then
    bind listing to itself
    returns listing
owner (listing: Listing) : returns (seller: Seller)
  where listing is missing
  then
    refuses INVALID_LISTING "This listing no longer exists."
  where listing exists
  then
    bind seller to the listing owner
    returns seller
quote (listing: Listing, buyer: Seller, amount: String) : returns (seller: Seller, terms: String)
  where listing is missing, buyer owns it, or a nonempty amount is invalid or offers are disabled
  then
    refuses INVALID_LISTING "Choose an available offer-enabled listing and a valid amount."
  where listing belongs to another seller and amount is empty or a valid offer
  then
    snapshot listing details with offered price if supplied
    returns seller, terms
freeze (listing: Listing) : returns (listing: Listing)
  where true
  then
    mark the listing locked against future updates; repeated freezing is harmless
    returns listing
update (seller: Seller, listing: Listing, details: String, previous: String) : returns (listing: Listing)
  where listing is locked
  then
    refuses LISTING_LOCKED "Payment sent and sold listings cannot be edited."
  where details are invalid, seller does not own listing, or current details differ from previous
  then
    refuses INVALID_LISTING "Reopen the listing and check your changes."
  where seller owns an unlocked listing and previous matches
  then
    atomically replace validated details
    returns listing
```
## Queries
```queries
_visible (reader: Seller) : many (listing: Listing, seller: Seller, details: String)
  answers all listings with payment instructions removed unless reader is seller
_all () : many (listing: Listing, seller: Seller, details: String)
  answers all listings in creation order
_publicAll () : many (listing: Listing, seller: Seller, details: String)
  answers listings in creation order with payment instructions removed from details
_get (listing: Listing) : optional (seller: Seller, details: String)
  answers the listing or no rows when missing
_mayBuy (listing: Listing, buyer: Seller) : one (allowed: Flag)
  answers true only when the listing exists and buyer differs from seller
```
