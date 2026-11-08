import { NextRequest, NextResponse } from 'next/server';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { inr, todayIST } from './util';

const app = getApps()[0] ?? initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON!)) });
export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);

export class HttpError extends Error {
  constructor(public status: number, msg: string) { super(msg); }
}
export function handle(fn: (req: NextRequest) => Promise<unknown>) {
  return async (req: NextRequest) => {
    try { return NextResponse.json(await fn(req)); }
    catch (e: any) {
      const status = e instanceof HttpError ? e.status : 500;
      if (status === 500) console.error(e);
      return NextResponse.json({ error: status === 500 ? 'Something went wrong' : e.message }, { status });
    }
  };
}
export type Ctx = { uid: string; role: 'owner' | 'member'; name: string };

export async function getCtx(req: NextRequest, opts: { owner?: boolean } = {}): Promise<Ctx> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new HttpError(401, 'Sign in again');
  const decoded = await adminAuth.verifyIdToken(token).catch(() => { throw new HttpError(401, 'Sign in again'); });
  const snap = await adminDb.doc(`users/${decoded.uid}`).get();
  const u = snap.data();
  if (!u || !u.active) throw new HttpError(403, 'This account is disabled');
  const role = decoded.role as 'owner' | 'member';
  if (opts.owner && role !== 'owner') throw new HttpError(403, 'Only the owner can do this');
  if (role === 'member') {
    const abs = await adminDb.doc(`attendance/${todayIST()}/records/${decoded.uid}`).get();
    if (abs.exists) throw new HttpError(403, 'You are on holiday mode. Enjoy :)');
  }
  return { uid: decoded.uid, role, name: u.name };
}

// Push a "new transaction" alert to every active user except the creator and anyone absent today.
export async function notifyTxn(creatorUid: string, t: any, byName: string) {
  const [users, absent] = await Promise.all([
    adminDb.collection('users').where('active', '==', true).get(),
    adminDb.collection(`attendance/${todayIST()}/records`).get(),
  ]);
  const skip = new Set([creatorUid, ...absent.docs.map((d) => d.id)]);
  const owners: Record<string, any> = {};
  const tokens: string[] = [];
  for (const u of users.docs) {
    if (skip.has(u.id)) continue;
    for (const d of (await u.ref.collection('devices').get()).docs) { tokens.push(d.id); owners[d.id] = d.ref; }
  }
  if (!tokens.length) return;
  const res = await getMessaging(app).sendEachForMulticast({
    tokens,
    notification: {
      title: `${t.type} ${inr(t.amount)} · ${t.mode === 'ONLINE' ? t.onlineMethod : 'Cash'}`,
      body: `${t.particulars} · by ${byName}`,
    },
    webpush: { fcmOptions: { link: '/' } },
  });
  await Promise.all(res.responses.map((r, i) =>
    !r.success && r.error?.code === 'messaging/registration-token-not-registered' ? owners[tokens[i]].delete() : null));
}
