import { registerConcept } from '@mit-sdg/sync-engine/assembly';
import { ImageUploadingConcept, InvalidImage } from './ImageUploading.ts';
import spec from '@design/concepts/ImageUploading.md' with { type: 'text' };
export const imageuploading = registerConcept({ class: ImageUploadingConcept, spec, refusals: { INVALID_IMAGE: InvalidImage } });
