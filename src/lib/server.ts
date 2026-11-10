import { NextRequest, NextResponse } from 'next/server';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { inr, normEmail, OWNER_EMAIL, todayIST } from './util';

// Initialised on first use, so `next build` does not need the secret.
function getAdmin() {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not set');
  return initializeApp({ credential: cert(JSON.parse(raw)) });
}
const lazy = <T extends object>(make: () => T): T =>
  new Proxy({} as T, { get: (_, k) => { const o: any = make(); const v = o[k]; return typeof v === 'function' ? v.bind(o) : v; } });
export const adminAuth = lazy(() => getAuth(getAdmin()));
export const adminDb = lazy(() => getFirestore(getAdmin()));

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
export type Ctx = { uid: string; role: 'owner' | 'member'; name: string; key: string };

export async function verifyReq(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new HttpError(401, 'Sign in again');
  // checkRevoked = true: removing a member takes effect immediately
  return adminAuth.verifyIdToken(token, true).catch(() => { throw new HttpError(401, 'Sign in again'); });
}

export async function getCtx(req: NextRequest, opts: { owner?: boolean } = {}): Promise<Ctx> {
  const d = await verifyReq(req);
  if (d.role === 'owner') {
    if (normEmail(d.email || '') !== normEmail(OWNER_EMAIL)) throw new HttpError(403, 'No access');
    return { uid: d.uid, role: 'owner', name: d.name || 'Owner', key: '' };
  }
  if (d.role === 'member' && d.mk) {
    if (opts.owner) throw new HttpError(403, 'Only the owner can do this');
    const m = await adminDb.doc(`members/${d.mk}`).get();
    if (!m.exists || !m.data()!.active) throw new HttpError(403, 'Your access was removed by the owner');
    if ((await adminDb.doc(`attendance/${todayIST()}/records/${d.mk}`).get()).exists) throw new HttpError(403, 'You are on holiday mode. Enjoy :)');
    return { uid: d.uid, role: 'member', name: m.data()!.name || d.name || 'Member', key: d.mk };
  }
  throw new HttpError(403, 'No access');
}

// Push a "new transaction" alert to every active user except the creator and anyone absent today.
export async function notifyTxn(creatorUid: string, t: any, byName: string) {
  const [users, absent] = await Promise.all([
    adminDb.collection('users').where('active', '==', true).get(),
    adminDb.collection(`attendance/${todayIST()}/records`).get(),
  ]);
  const absentKeys = new Set(absent.docs.map((d) => d.id));
  const owners: Record<string, any> = {};
  const tokens: string[] = [];
  for (const u of users.docs) {
    if (u.id === creatorUid || absentKeys.has(u.data().key)) continue;
    for (const d of (await u.ref.collection('devices').get()).docs) { tokens.push(d.id); owners[d.id] = d.ref; }
  }
  if (!tokens.length) return;
  const res = await getMessaging(getAdmin()).sendEachForMulticast({
    tokens,
    notification: {
      title: `${t.type} ${inr(t.amount)} · ${t.mode === 'ONLINE' ? 'Online' : 'Cash'}`,
      body: `${t.particulars} · by ${byName}`,
    },
    webpush: { fcmOptions: { link: '/' } },
  });
  await Promise.all(res.responses.map((r, i) =>
    !r.success && r.error?.code === 'messaging/registration-token-not-registered' ? owners[tokens[i]].delete() : null));
}
