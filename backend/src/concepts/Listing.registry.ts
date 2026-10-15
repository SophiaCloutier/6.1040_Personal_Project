import { registerConcept } from '@mit-sdg/sync-engine/assembly';
import { ListingConcept, InvalidListing } from './Listing.ts';
import spec from '@design/concepts/Listing.md' with { type: 'text' };
export const listing = registerConcept({ class: ListingConcept, spec, refusals: { INVALID_LISTING: InvalidListing } });
