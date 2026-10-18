import { registerConcept } from '@mit-sdg/sync-engine/assembly';
import { ListingConcept, InvalidListing, ListingLocked } from './Listing.ts';
import spec from '@design/concepts/Listing.md' with { type: 'text' };
export const listing = registerConcept({ class: ListingConcept, spec, refusals: { LISTING_LOCKED: ListingLocked, INVALID_LISTING: InvalidListing } });
