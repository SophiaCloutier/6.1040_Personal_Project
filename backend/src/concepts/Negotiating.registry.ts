import { registerConcept } from '@mit-sdg/sync-engine/assembly';
import { NegotiatingConcept, InvalidOffer } from './Negotiating.ts';
import spec from '@design/concepts/Negotiating.md' with { type: 'text' };
export const negotiating = registerConcept({ class: NegotiatingConcept, spec, refusals: { INVALID_OFFER: InvalidOffer } });
