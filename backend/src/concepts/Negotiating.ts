import { MongoClient } from 'mongodb';
export class InvalidOffer extends Error {}
export class NegotiatingConcept {
  private readonly client = new MongoClient(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017');
  private readonly rows = this.client.db(process.env.MONGODB_DATABASE ?? 'claimed').collection<{ offer: string; buyer: string; seller: string; subject: string; terms: string; status: string }>('offers');
  async propose({ buyer, seller, subject, terms }: { buyer: string; seller: string; subject: string; terms: string }) {
    if (buyer === seller) throw new InvalidOffer('You cannot offer on your own listing.');
    const offer = crypto.randomUUID();
    await this.rows.insertOne({ offer, buyer, seller, subject, terms, status: 'pending' });
    return { offer };
  }
  async resolve({ actor, offer, decision }: { actor: string; offer: string; decision: string }) {
    if (!['declined', 'withdrawn'].includes(decision)) throw new InvalidOffer('Choose decline or withdraw.');
    const result = await this.rows.updateOne({ offer, status: 'pending', ...(decision === 'declined' ? { seller: actor } : { buyer: actor }) }, { $set: { status: decision } });
    if (!result.modifiedCount) throw new InvalidOffer('This offer is no longer pending or belongs to someone else.');
    return { offer };
  }
  async select({ actor, offer }: { actor: string; offer: string }) {
    const row = await this.rows.findOne({ offer, seller: actor, status: 'pending' });
    if (!row) throw new InvalidOffer('Only the seller can accept a pending offer.');
    // Selection supplies immutable terms; Claiming is the sole reservation authority.
    return { buyer: row.buyer, subject: row.subject, terms: JSON.stringify({ ...JSON.parse(row.terms), offer }) };
  }
  async close({ subject, buyer, terms }: { subject: string; buyer: string; terms: string }) {
    const selected = JSON.parse(terms).offer;
    if (typeof selected === 'string') await this.rows.updateOne({ offer: selected, subject, buyer }, { $set: { status: 'accepted' } });
    await this.rows.updateMany({ subject, status: 'pending' }, { $set: { status: 'superseded' } });
    return { subject };
  }
  async _inbox({ actor }: { actor: string }) {
    return (await this.rows.find({ $or: [{ seller: actor }, { buyer: actor }] }).sort({ _id: 1 }).toArray()).map(({ _id, ...row }) => row);
  }
}
