import { registerConcept } from '@mit-sdg/sync-engine/assembly';
import { MessagingConcept, InvalidMessage } from './Messaging.ts';
import spec from '@design/concepts/Messaging.md' with { type: 'text' };
export const messaging = registerConcept({ class: MessagingConcept, spec, refusals: { INVALID_MESSAGE: InvalidMessage } });
