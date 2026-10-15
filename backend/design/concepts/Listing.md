# Listing
## Purpose
Make items available for discovery with seller-supplied information.
## Principle
A seller creates a listing; readers discover its details. Descriptive tags may be chosen from suggestions or created by the seller. Tags are normalized, deduplicated, and limited to 12 per listing and 40 characters each. Optional clothing size is a string of at most 24 characters; standard names such as medium normalize to M, while numeric sizes retain their size-system prefix. Purchase policy can determine whether a buyer differs from its seller.
Listing details contain an ordered array of zero to five image URLs. The first image is the cover image. Legacy single-image input is normalized to a one-element array; malformed image URLs and more than five images are refused.

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
```
## Actions
```actions
create (seller: Seller, details: String) : returns (listing: Listing)
  where details do not describe a valid fixed-price item
  then
    refuses INVALID_LISTING "Enter valid listing information."
  where details are valid
  then
    create a fresh listing with seller and details
    returns listing
```
## Queries
```queries
_all () : many (listing: Listing, seller: Seller, details: String)
  answers all listings in creation order
_publicAll () : many (listing: Listing, seller: Seller, details: String)
  answers listings in creation order with payment instructions removed from details
_get (listing: Listing) : optional (seller: Seller, details: String)
  answers the listing or no rows when missing
_mayBuy (listing: Listing, buyer: Seller) : one (allowed: Flag)
  answers true only when the listing exists and buyer differs from seller
```



