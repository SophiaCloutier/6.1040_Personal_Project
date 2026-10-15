import { MongoClient } from 'mongodb';
import { normalizeClothingSize } from '../../shared/clothing-sizes.ts';
export class InvalidListing extends Error {}
export class ListingConcept {
  private readonly client = new MongoClient(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017');
  private readonly rows = this.client.db(process.env.MONGODB_DATABASE ?? 'claimed').collection<{ listing: string; seller: string; details: string }>('listings');
  async create({ seller, details }: { seller: string; details: string }) {
    let value;
    try { value = JSON.parse(details); } catch { throw new InvalidListing('Listing details are invalid.'); }
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new InvalidListing('Listing details are invalid.');
    const images = value.images === undefined ? (value.image ? [value.image] : []) : value.images;
    if (!Array.isArray(images) || images.length > 5 || images.some((image: unknown) => typeof image !== 'string' || image.length > 2000 || (!/^https?:\/\//.test(image) && !/^\/uploads\/[a-f0-9-]{36}\.webp$/.test(image)))) throw new InvalidListing('Choose up to five valid item photos.');
    value.images = [...new Set(images)];
    value.image = value.images[0] ?? '';
    if (value.clothingSize !== undefined && (typeof value.clothingSize !== 'string' || value.clothingSize.trim().length > 24)) throw new InvalidListing('Clothing size must be at most 24 characters.');
    value.clothingSize = normalizeClothingSize(value.clothingSize ?? '');
    if (value && value.category === undefined) value.category = 'Other';
    if (value && value.tags !== undefined && (!Array.isArray(value.tags) || value.tags.length > 12 || value.tags.some((tag: unknown) => typeof tag !== 'string' || !tag.trim() || tag.trim().length > 40))) throw new InvalidListing('Choose up to 12 tags, each between 1 and 40 characters.');
    if (value) value.tags = [...new Set((value.tags ?? []).map((tag: string) => tag.trim().replace(/\s+/g, ' ').toLowerCase()))];
    if (!value || typeof value.title !== 'string' || !value.title.trim() || value.title.length > 100 ||
      typeof value.description !== 'string' || value.description.length > 2000 ||
      typeof value.price !== 'number' || !Number.isFinite(value.price) || value.price < 0 || value.price > 100000 ||
      !['Furniture', 'Clothing', 'Electronics', 'Books', 'Other'].includes(value.category) ||
      typeof value.pickup !== 'string' || !value.pickup.trim() || value.pickup.length > 200 ||
      typeof value.payment !== 'string' || !value.payment.trim() || value.payment.length > 200 ||
      typeof value.image !== 'string' || value.image.length > 2000 || (value.image && !/^https?:\/\//.test(value.image) && !/^\/uploads\/[a-f0-9-]{36}\.webp$/.test(value.image)))
      throw new InvalidListing('Enter a title, valid price, category, pickup location, payment instructions, and an optional HTTP image URL.');
    const listing = crypto.randomUUID();
    await this.rows.insertOne({ listing, seller, details: JSON.stringify(value) });
    return { listing };
  }
  async _all({}: {}) : Promise<Array<{ listing: string; seller: string; details: string }>> {
    return (await this.rows.find({}).sort({ _id: 1 }).toArray()).map(({ listing, seller, details }) => ({ listing, seller, details }));
  }
  async _get({ listing }: { listing: string }): Promise<Array<{ seller: string; details: string }>> {
    const row = await this.rows.findOne({ listing });
    return row ? [{ seller: row.seller, details: row.details }] : [];
  }
  async _publicAll({}: {}): Promise<Array<{ listing: string; seller: string; details: string }>> {
    return (await this._all({})).map(row => {
      const details = JSON.parse(row.details);
      delete details.payment;
      return { ...row, details: JSON.stringify(details) };
    });
  }
  async _mayBuy({ listing, buyer }: { listing: string; buyer: string }) {
    const row = await this.rows.findOne({ listing });
    return { allowed: !!row && row.seller !== buyer };
  }
}

