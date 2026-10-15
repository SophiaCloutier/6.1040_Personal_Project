import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

export class InvalidImage extends Error {}
export const uploadDirectory = () => process.env.UPLOAD_DIRECTORY ?? resolve(import.meta.dir, '../../uploads');
export class ImageUploadingConcept {
  async store({ data, mime }: { data: string; mime: string }) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) throw new InvalidImage('Choose a JPEG, PNG, or WebP photo.');
    if (!data.length || data.length > 7_000_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) throw new InvalidImage('Choose a valid photo up to 5 MB.');
    const bytes = Buffer.from(data, 'base64');
    if (!bytes.length || bytes.length > 5 * 1024 * 1024) throw new InvalidImage('Choose a valid photo up to 5 MB.');
    let output: Buffer;
    try {
      const image = sharp(bytes, { limitInputPixels: 25_000_000, animated: false });
      const metadata = await image.metadata();
      const expected: Record<string, string> = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' };
      if (metadata.format !== expected[mime]) throw new Error('File type mismatch');
      output = await image.rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    } catch { throw new InvalidImage('This photo could not be read. Choose a valid JPEG, PNG, or WebP image.'); }
    const filename = crypto.randomUUID() + '.webp';
    await mkdir(uploadDirectory(), { recursive: true });
    await writeFile(resolve(uploadDirectory(), filename), output, { flag: 'wx' });
    return { image: '/uploads/' + filename };
  }
}
