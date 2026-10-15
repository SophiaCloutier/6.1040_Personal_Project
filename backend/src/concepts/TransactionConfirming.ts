import { MongoClient, MongoServerError } from 'mongodb';
export class InvalidTransaction extends Error {}
export class CancellationUnavailable extends Error {}
export class TransactionConfirmingConcept {
  private readonly client = new MongoClient(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017');
  private readonly rows = this.client.db(process.env.MONGODB_DATABASE ?? 'claimed').collection<{ payer: string; payee: string; subject: string; status: string }>('transactions');
  async start({ payer, payee, subject }: { payer: string; payee: string; subject: string }) {
    await this.rows.createIndex({ subject: 1 }, { unique: true });
    try { await this.rows.insertOne({ payer, payee, subject, status: 'awaitingPayment' }); }
    catch(error) { if(error instanceof MongoServerError && error.code === 11000) throw new InvalidTransaction('A transaction already exists for this item.'); throw error; }
    return { subject };
  }
  async reportPaid({ payer, subject }: { payer: string; subject: string }) {
    const result = await this.rows.updateOne({ payer, subject, status: 'awaitingPayment' }, { $set: { status: 'awaitingConfirmation' } });
    if (!result.modifiedCount) throw new InvalidTransaction('Only the buyer can report payment on an unpaid transaction.');
    return { subject };
  }
  async confirmReceived({ payee, subject }: { payee: string; subject: string }) {
    const result = await this.rows.updateOne({ payee, subject, status: 'awaitingConfirmation' }, { $set: { status: 'confirmed' } });
    if (!result.modifiedCount) throw new InvalidTransaction('Only the seller can confirm a payment reported by the buyer.');
    return { subject };
  }
  async cancel({ actor, subject }: { actor: string; subject: string }) {
    const row = await this.rows.findOneAndDelete({ subject, status: 'awaitingPayment', $or: [{ payer: actor }, { payee: actor }] });
    if (!row) throw new CancellationUnavailable('Only the buyer or seller can cancel before payment is reported.');
    return { subject, payer: row.payer };
  }
  async _get({ subject }: { subject: string }): Promise<Array<{ payer: string; payee: string; status: string }>> {
    const row = await this.rows.findOne({ subject });
    return row ? [{ payer: row.payer, payee: row.payee, status: row.status }] : [];
  }
}
