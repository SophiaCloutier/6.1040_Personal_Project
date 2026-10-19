import { imageStorage } from '../image-storage.ts';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { encodePhoto } from '../image-codec.ts';
export { InvalidImage } from '../image-codec.ts';

export const uploadDirectory = () => process.env.UPLOAD_DIRECTORY ?? resolve(import.meta.dir, '../../uploads');
export class ImageUploadingConcept {
  async store({ data, mime }: { data: string; mime: string }) {
    const output = await encodePhoto(data, mime);
    const filename = crypto.randomUUID() + '.webp';
    const storage = imageStorage();
    if (storage) {
      await storage.write('uploads/' + filename, output, { type: 'image/webp' });
      return { image: '/uploads/' + filename };
    }
    await mkdir(uploadDirectory(), { recursive: true });
    await writeFile(resolve(uploadDirectory(), filename), output, { flag: 'wx' });
    return { image: '/uploads/' + filename };
  }
}
