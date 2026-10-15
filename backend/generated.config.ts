import { assembleApplication } from "./src/assembly.ts";
import { httpWire } from '@mit-sdg/sync-engine-http/tooling';
import { policy } from './src/edge.ts';

export default {
  assemble: assembleApplication,
  title: "Claimed",
  wireName: 'ClaimedWire',
  design: { version: 1, documents: [new URL('./design/types.md', import.meta.url), new URL('./design/compositions/Sessions.md', import.meta.url), new URL('./design/compositions/Marketplace.md', import.meta.url), new URL('./design/compositions/Images.md', import.meta.url)] },
  projections: [httpWire({ policy, name: 'ClaimedWireHttp' })],
};

