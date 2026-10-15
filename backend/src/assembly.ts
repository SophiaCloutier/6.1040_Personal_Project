import { assemble } from "@mit-sdg/sync-engine/assembly";
import { applicationConceptSet } from "./concepts.ts";
import { composition } from './compositions/Sessions.ts';
import { composition as marketplace } from './compositions/Marketplace.ts';
import { composition as images } from './compositions/Images.ts';

export function assembleApplication() {
  return assemble({
    conceptSet: applicationConceptSet,
    composition: { Sessions: composition, Marketplace: marketplace, Images: images },
  });
}
