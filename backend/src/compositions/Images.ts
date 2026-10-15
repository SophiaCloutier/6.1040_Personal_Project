import { endpoint, receive, respond } from '@mit-sdg/sync-engine/boundary';
import { concepts } from '../concepts.ts';
import { validator, hasOnly } from './validators.ts';
const { Sessioning, ImageUploading } = concepts;
const Upload = endpoint('/images/upload', ({ session, data, mime, image }) => receive({ session, data, mime })
  .then(Sessioning.current({ session }).responds({}))
  .then(ImageUploading.store({ data, mime }).responds({ image }))
  .then(respond({ image })), { input: { required: ['session', 'data', 'mime'] }, validators: { input: validator(v => hasOnly(v, ['session', 'data', 'mime']) && (typeof v.session === 'string' || v.session === null) && typeof v.data === 'string' && v.data.length <= 7_000_000 && typeof v.mime === 'string', 'Choose a photo up to 5 MB.') } });
export const composition = { Photos: { Upload } };
