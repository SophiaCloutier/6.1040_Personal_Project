import { InvalidImage } from '../image-codec.ts';
import { registerConcept } from '@mit-sdg/sync-engine/assembly';
import { TransactionConfirmingConcept, InvalidTransaction, CancellationUnavailable } from './TransactionConfirming.ts';
import spec from '@design/concepts/TransactionConfirming.md' with { type: 'text' };
export const transactionconfirming = registerConcept({ class: TransactionConfirmingConcept, spec, refusals: { INVALID_IMAGE: InvalidImage, INVALID_TRANSACTION: InvalidTransaction, CANCELLATION_UNAVAILABLE: CancellationUnavailable } });
