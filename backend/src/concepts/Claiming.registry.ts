import { registerConcept } from '@mit-sdg/sync-engine/assembly';
import { ClaimingConcept, ClaimUnavailable } from './Claiming.ts';
import spec from '@design/concepts/Claiming.md' with { type: 'text' };
export const claiming = registerConcept({ class: ClaimingConcept, spec, refusals: { CLAIM_UNAVAILABLE: ClaimUnavailable } });
