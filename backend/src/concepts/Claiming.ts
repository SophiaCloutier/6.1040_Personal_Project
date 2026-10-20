import { database } from '../database.ts';
import { MongoServerError } from 'mongodb';
export class ClaimUnavailable extends Error {}
export class ClaimingConcept {
  private readonly rows = database().collection<{ resource: string; status: string; claimer: string; terms?: string }>('claims');
  async makeAvailable({ resource }: { resource: string }) {
    await this.rows.createIndex({ resource: 1 }, { unique: true });
    try { await this.rows.insertOne({ resource, status: 'available', claimer: '' }); }
    catch(error) { if (error instanceof MongoServerError && error.code === 11000) throw new ClaimUnavailable('This item already has an availability record.'); throw error; }
    return { resource };
  }
  async claim({ claimer, resource }: { claimer: string; resource: string }) {
    const result = await this.rows.updateOne({ resource, status: 'available' }, { $set: { status: 'claimed', claimer } });
    if (!result.modifiedCount) throw new ClaimUnavailable('This item is no longer available.');
    return { resource };
  }
  async checkAvailable({ resource }: { resource: string }) {
    if (!await this.rows.findOne({ resource, status: 'available' })) throw new ClaimUnavailable('This item is no longer available.');
    return { resource };
  }
  async remove({ resource }: { resource: string }) {
    const result = await this.rows.updateOne({ resource, status: 'available' }, { $set: { status: 'removed' } });
    if (!result.modifiedCount) throw new ClaimUnavailable('Only available items can be removed.');
    return { resource };
  }
  async reserve({ claimer, resource, terms }: { claimer: string; resource: string; terms: string }) {
    const result = await this.rows.updateOne({ resource, status: 'available' }, { $set: { status: 'claimed', claimer, terms } });
    if (!result.modifiedCount) throw new ClaimUnavailable('This item is no longer available.');
    return { resource, claimer, terms };
  }
  async complete({ claimer, resource }: { claimer: string; resource: string }) {
    const result = await this.rows.updateOne({ resource, status: 'claimed', claimer }, { $set: { status: 'completed' } });
    if (!result.modifiedCount) throw new ClaimUnavailable('This claim cannot be completed.');
    return { resource };
  }
  async release({ claimer, resource }: { claimer: string; resource: string }) {
    const result = await this.rows.updateOne({ resource, status: 'claimed', claimer }, { $set: { status: 'available', claimer: '', terms: '' } });
    if (!result.modifiedCount) throw new ClaimUnavailable('Only the current claimer can release a reserved item.');
    return { resource };
  }
  async _get({ resource }: { resource: string }): Promise<Array<{ status: string; claimer: string }>> {
    const row = await this.rows.findOne({ resource });
    return row ? [{ status: row.status, claimer: row.claimer }] : [];
  }
}
