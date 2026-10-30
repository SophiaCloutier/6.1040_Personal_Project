import { database } from '../database.ts';
import { MongoServerError } from 'mongodb';
import { encodePhoto } from '../image-codec.ts';
export class InvalidTransaction extends Error {}
export class CancellationUnavailable extends Error {}
export class TransactionConfirmingConcept {
  private readonly rows = database().collection<{ payer: string; payee: string; subject: string; status: string; terms?: string; evidence?: string }>('transactions');
  async start({ payer, payee, subject }: { payer: string; payee: string; subject: string }) {
    await this.rows.createIndex({ subject: 1 }, { unique: true });
    try { await this.rows.insertOne({ payer, payee, subject, status: 'awaitingPayment' }); }
    catch(error) { if(error instanceof MongoServerError && error.code === 11000) throw new InvalidTransaction('A transaction already exists for this item.'); throw error; }
    return { subject };
  }
  async startWithTerms({ payer, payee, subject, terms }: { payer: string; payee: string; subject: string; terms: string }) {
    await this.rows.createIndex({ subject: 1 }, { unique: true });
    try { await this.rows.insertOne({ payer, payee, subject, terms, evidence: '', status: 'awaitingPayment' }); }
    catch (error) { if (error instanceof MongoServerError && error.code === 11000) throw new InvalidTransaction('A transaction already exists.'); throw error; }
    return { subject };
  }
  async report({ payer, subject, data, mime }: { payer: string; subject: string; data: string; mime: string }) {
    const row = await this.rows.findOne({ payer, subject, status: { $in: ['awaitingPayment', 'paymentRejected'] } });
    if (!row) throw new InvalidTransaction('Only the buyer can report an unpaid transaction.');
    if (row.terms && JSON.parse(row.terms).requireProof && !data) throw new InvalidTransaction('Attach payment evidence before reporting payment.');
    const evidence = data ? 'data:image/webp;base64,' + (await encodePhoto(data, mime)).toString('base64') : '';
    const result = await this.rows.updateOne({ _id: row._id, status: row.status }, { $set: { status: 'awaitingConfirmation', evidence } });
    if (!result.modifiedCount) throw new InvalidTransaction('This reservation changed. Reopen it before reporting payment.');
    return { subject };
  }
  async _private({ subject, actor }: { subject: string; actor: string }): Promise<Array<{ terms: string; evidence: string }>> {
    const row = await this.rows.findOne({ subject, $or: [{ payer: actor }, { payee: actor }] });
    return row ? [{ terms: row.terms ?? '{}', evidence: row.evidence ?? '' }] : [];
  }
  async reportPaid({ payer, subject }: { payer: string; subject: string }) {
    const row = await this.rows.findOne({ payer, subject, status: { $in: ['awaitingPayment', 'paymentRejected'] } });
    if (row?.terms && JSON.parse(row.terms).requireProof) throw new InvalidTransaction('Attach payment evidence before reporting payment.');
    const result = await this.rows.updateOne({ payer, subject, status: { $in: ['awaitingPayment', 'paymentRejected'] } }, { $set: { status: 'awaitingConfirmation' } });
    if (!result.modifiedCount) throw new InvalidTransaction('Only the buyer can report payment on an unpaid transaction.');
    return { subject };
  }
  async confirmReceived({ payee, subject }: { payee: string; subject: string }) {
    const result = await this.rows.updateOne({ payee, subject, status: 'awaitingConfirmation' }, { $set: { status: 'confirmed' } });
    if (!result.modifiedCount) throw new InvalidTransaction('Only the seller can confirm a payment reported by the buyer.');
    return { subject };
  }
  async rejectPayment({ payee, subject, decision }: { payee: string; subject: string; decision: string }) {
    if (!['retry', 'relist'].includes(decision)) throw new InvalidTransaction('Choose return to buyer or make available.');
    const filter = { payee, subject, status: 'awaitingConfirmation' };
    if (decision === 'relist') {
      const row = await this.rows.findOneAndDelete(filter);
      if (!row) throw new InvalidTransaction('Only the seller can reject a reported payment.');
      return { subject, payer: row.payer, decision };
    }
    const row = await this.rows.findOneAndUpdate(filter, { $set: { status: 'paymentRejected', evidence: '' } });
    if (!row) throw new InvalidTransaction('Only the seller can reject a reported payment.');
    return { subject, payer: row.payer, decision };
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
