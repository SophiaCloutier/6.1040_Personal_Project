import { database } from '../database.ts';

import { normalizeClothingSize } from '../../shared/clothing-sizes.ts';
export class InvalidListing extends Error {}
export class ListingLocked extends Error {}
export class ListingConcept {
  private readonly rows = database().collection<{ listing: string; seller: string; details: string; locked?: boolean }>('listings');
  #normalize(details: string): string {
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
    if (value.obo !== undefined && typeof value.obo !== 'boolean') throw new InvalidListing('Choose whether offers are allowed.');
    if (value.requireProof !== undefined && typeof value.requireProof !== 'boolean') throw new InvalidListing('Choose whether payment evidence is required.');
    value.obo = value.obo ?? false;
    value.requireProof = value.requireProof ?? false;
    const positions = value.imagePositions ?? {};
    if (!positions || typeof positions !== 'object' || Array.isArray(positions) || Object.entries(positions).some(([url, point]: [string, any]) => !value.images.includes(url) || !point || typeof point.x !== 'number' || typeof point.y !== 'number' || !Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 0 || point.x > 100 || point.y < 0 || point.y > 100 || (point.zoom !== undefined && (typeof point.zoom !== 'number' || !Number.isFinite(point.zoom) || point.zoom < 1 || point.zoom > 4)))) throw new InvalidListing('Photo positions must be between 0 and 100 and zoom between 1 and 4.');
    value.imagePositions = positions;
    return JSON.stringify(value);
  }
  async update({ seller, listing, details, previous }: { seller: string; listing: string; details: string; previous: string }) {
    const normalized = this.#normalize(details);
    const row = await this.rows.findOne({ listing, seller });
    if (row?.locked) throw new ListingLocked('Payment has been sent or this item is sold. Listing edits are closed.');
    const result = await this.rows.updateOne({ listing, seller, details: previous, locked: { $ne: true } }, { $set: { details: normalized } });
    if (!result.matchedCount) throw new InvalidListing('Only the seller can edit this listing. It may have changed; reopen it and try again.');
    return { listing };
  }
  async freeze({ listing }: { listing: string }) {
    await this.rows.updateOne({ listing }, { $set: { locked: true } });
    return { listing };
  }
  async create({ seller, details }: { seller: string; details: string }) {
    const normalized = this.#normalize(details);
    const listing = crypto.randomUUID();
    await this.rows.insertOne({ listing, seller, details: normalized });
    return { listing };
  }
  async quote({ listing, buyer, amount }: { listing: string; buyer: string; amount: string }) {
    const row = await this.rows.findOne({ listing });
    if (!row || row.seller === buyer) throw new InvalidListing('Choose an item sold by another account.');
    const terms = JSON.parse(row.details);
    if (amount !== '') {
      const price = Number(amount);
      if (!terms.obo || !/^\d+(\.\d{1,2})?$/.test(amount) || !Number.isFinite(price) || price <= 0 || price > 100000) throw new InvalidListing('This listing must allow offers. Enter a positive amount with at most two decimal places.');
      terms.price = price;
    }
    return { seller: row.seller, terms: JSON.stringify(terms) };
  }
  async owner({ listing }: { listing: string }) {
    const row = await this.rows.findOne({ listing });
    if (!row) throw new InvalidListing('This listing no longer exists.');
    return { seller: row.seller };
  }
  async authorizeRemoval({ seller, listing }: { seller: string; listing: string }) {
    if (!await this.rows.findOne({ listing, seller })) throw new InvalidListing('Only the seller can remove this listing.');
    return { listing };
  }
  async _visible({ reader }: { reader: string }): Promise<Array<{ listing: string; seller: string; details: string }>> {
    return (await this._all({})).map(row => {
      if (row.seller === reader) return row;
      const details = JSON.parse(row.details); delete details.payment;
      return { ...row, details: JSON.stringify(details) };
    });
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
