import { MongoClient } from 'mongodb';
export class InvalidMessage extends Error {}
export class MessagingConcept {
  private readonly client = new MongoClient(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017');
  private readonly rows = this.client.db(process.env.MONGODB_DATABASE ?? 'claimed').collection<{ message: string; subject: string; buyer: string; seller: string; sender: string; text: string; sentAt: string }>('messages');
  async send({ actor, buyer, seller, subject, text }: { actor: string; buyer: string; seller: string; subject: string; text: string }) {
    if (!text.trim() || text.length > 2000 || !buyer || buyer === seller || (actor !== buyer && actor !== seller)) throw new InvalidMessage('Write a message of 1–2000 characters to the other participant.');
    if (actor === seller && !await this.rows.findOne({ buyer, seller, subject })) throw new InvalidMessage('Reply to an existing buyer conversation.');
    const message = crypto.randomUUID();
    await this.rows.insertOne({ message, subject, buyer, seller, sender: actor, text: text.trim(), sentAt: new Date().toISOString() });
    return { message };
  }
  async _conversations({ actor }: { actor: string }): Promise<Array<{ subject: string; buyer: string; seller: string; message: string; text: string; sentAt: string }>> {
    const rows = await this.rows.aggregate<{ subject: string; buyer: string; seller: string; message: string; text: string; sentAt: string }>([
      { $match: { $or: [{ buyer: actor }, { seller: actor }] } },
      { $sort: { _id: -1 } },
      { $group: { _id: { subject: '$subject', buyer: '$buyer' }, latest: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$latest' } },
      { $sort: { _id: -1 } }, { $limit: 100 },
    ]).toArray();
    return rows.map(({ subject, buyer, seller, message, text, sentAt }) => ({ subject, buyer, seller, message, text, sentAt }));
  }
  async _thread({ actor, subject, buyer }: { actor: string; subject: string; buyer: string }): Promise<Array<{ message: string; subject: string; buyer: string; seller: string; sender: string; text: string; sentAt: string }>> {
    return this._history({ actor, subject, buyer, before: '' });
  }
  async _history({ actor, subject, buyer, before }: { actor: string; subject: string; buyer: string; before: string }): Promise<Array<{ message: string; subject: string; buyer: string; seller: string; sender: string; text: string; sentAt: string }>> {
    const participant = { subject, buyer, $or: [{ buyer: actor }, { seller: actor }] };
    const cursor = before ? await this.rows.findOne({ ...participant, message: before }) : null;
    if (before && !cursor) return [];
    return (await this.rows.find({ ...participant, ...(cursor ? { _id: { $lt: cursor._id } } : {}) }).sort({ _id: -1 }).limit(200).toArray()).reverse().map(({ _id, ...row }) => row);
  }
  async _inbox({ actor }: { actor: string }) {
    return (await this.rows.find({ $or: [{ buyer: actor }, { seller: actor }] }).sort({ _id: -1 }).limit(500).toArray()).reverse().map(({ _id, ...row }) => row);
  }
}
