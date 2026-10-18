import { assemble } from "@mit-sdg/sync-engine/assembly";
import { applicationConceptSet } from "./concepts.ts";
import { composition } from './compositions/Sessions.ts';
import { composition as marketplace } from './compositions/Marketplace.ts';
import { composition as images } from './compositions/Images.ts';

import { composition as messages } from './compositions/Messages.ts';
export function assembleApplication() {
  return assemble({
    conceptSet: applicationConceptSet,
    composition: { Messages: messages, Sessions: composition, Marketplace: marketplace, Images: images },
  });
}
