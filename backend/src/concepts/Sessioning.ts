import { database } from '../database.ts';


export class UnknownSession extends Error {}

export class SessioningConcept {
  private readonly sessions = database().collection<{ session: string; subject: string; expiresAt: Date }>('sessions');

  async start({ subject }: { subject: string }) {
    await this.sessions.createIndex({ session: 1 }, { unique: true });
    await this.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    const session = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await this.sessions.insertOne({ session, subject, expiresAt });
    return { session, expiresAt };
  }

  async current({ session }: { session: string }) {
    const rows = await this._active({ session });
    if (!rows[0]) throw new UnknownSession('This session is not active.');
    return { subject: rows[0].subject };
  }

  async end({ session }: { session: string }) {
    const result = await this.sessions.deleteOne({ session, expiresAt: { $gt: new Date() } });
    if (!result.deletedCount) throw new UnknownSession('This session is not active.');
    return { ended: true };
  }

  async _active({ session }: { session: string }): Promise<Array<{ subject: string; expiresAt: Date }>> {
    const row = await this.sessions.findOne({ session, expiresAt: { $gt: new Date() } });
    return row ? [{ subject: row.subject, expiresAt: row.expiresAt }] : [];
  }
}
