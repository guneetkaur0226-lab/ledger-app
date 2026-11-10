import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb, getCtx, handle, HttpError } from '@/lib/server';
import { isEmail, normEmail, OWNER_EMAIL } from '@/lib/util';

// Owner adds a Google email to the allow-list
export const POST = handle(async (req) => {
  const ctx = await getCtx(req, { owner: true });
  const b = await req.json();
  const email = String(b.email ?? '').trim().toLowerCase();
  if (!isEmail(email)) throw new HttpError(400, 'Enter a valid Google email');
  const key = normEmail(email);
  if (key === normEmail(OWNER_EMAIL)) throw new HttpError(400, 'That is the owner account');
  const ref = adminDb.doc(`members/${key}`);
  if ((await ref.get()).exists) throw new HttpError(409, 'This email is already added');
  await ref.set({ email, name: String(b.name ?? '').trim() || email, active: true, addedBy: ctx.uid, addedAt: FieldValue.serverTimestamp() });
  return { key };
});

// Pause or resume a member, or rename them
export const PATCH = handle(async (req) => {
  await getCtx(req, { owner: true });
  const b = await req.json();
  const ref = adminDb.doc(`members/${b.key}`);
  const m = await ref.get();
  if (!m.exists) throw new HttpError(404, 'Member not found');
  const upd: any = {};
  if (typeof b.active === 'boolean') upd.active = b.active;
  if (typeof b.name === 'string' && b.name.trim()) upd.name = b.name.trim();
  await ref.update(upd);
  const uid = m.data()!.uid;
  if (uid && typeof b.active === 'boolean') {
    await adminDb.doc(`users/${uid}`).set({ active: b.active }, { merge: true });
    if (!b.active) await adminAuth.revokeRefreshTokens(uid);
  }
  return { ok: true };
});

// Remove access completely: allow-list entry, sign-in account and devices
export const DELETE = handle(async (req) => {
  await getCtx(req, { owner: true });
  const key = req.nextUrl.searchParams.get('key');
  if (!key) throw new HttpError(400, 'Missing member');
  const ref = adminDb.doc(`members/${key}`);
  const m = await ref.get();
  if (!m.exists) throw new HttpError(404, 'Member not found');
  const uid = m.data()!.uid;
  await ref.delete(); // from this moment the rules and the API refuse them
  if (uid) {
    await adminAuth.deleteUser(uid).catch(() => {});
    await adminDb.recursiveDelete(adminDb.doc(`users/${uid}`));
  }
  return { ok: true };
});
