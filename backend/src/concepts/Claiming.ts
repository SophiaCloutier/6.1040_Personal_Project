import { MongoClient, MongoServerError } from 'mongodb';
export class ClaimUnavailable extends Error {}
export class ClaimingConcept {
  private readonly client = new MongoClient(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017');
  private readonly rows = this.client.db(process.env.MONGODB_DATABASE ?? 'claimed').collection<{ resource: string; status: string; claimer: string }>('claims');
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
  async complete({ claimer, resource }: { claimer: string; resource: string }) {
    const result = await this.rows.updateOne({ resource, status: 'claimed', claimer }, { $set: { status: 'completed' } });
    if (!result.modifiedCount) throw new ClaimUnavailable('This claim cannot be completed.');
    return { resource };
  }
  async release({ claimer, resource }: { claimer: string; resource: string }) {
    const result = await this.rows.updateOne({ resource, status: 'claimed', claimer }, { $set: { status: 'available', claimer: '' } });
    if (!result.modifiedCount) throw new ClaimUnavailable('Only the current claimer can release a reserved item.');
    return { resource };
  }
  async _get({ resource }: { resource: string }): Promise<Array<{ status: string; claimer: string }>> {
    const row = await this.rows.findOne({ resource });
    return row ? [{ status: row.status, claimer: row.claimer }] : [];
  }
}
