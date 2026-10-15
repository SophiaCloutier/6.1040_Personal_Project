import { conceptSet } from "@mit-sdg/sync-engine/assembly";

import { authenticating } from './concepts/Authenticating.registry.ts';
import { sessioning } from './concepts/Sessioning.registry.ts';
import { listing } from './concepts/Listing.registry.ts';
import { claiming } from './concepts/Claiming.registry.ts';
import { transactionconfirming } from './concepts/TransactionConfirming.registry.ts';
import { imageuploading } from './concepts/ImageUploading.registry.ts';
export const applicationConceptSet = conceptSet({ Authenticating: authenticating, Sessioning: sessioning, Listing: listing, Claiming: claiming, TransactionConfirming: transactionconfirming, ImageUploading: imageuploading });
export const { concepts } = applicationConceptSet;
