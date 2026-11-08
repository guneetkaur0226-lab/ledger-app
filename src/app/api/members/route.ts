import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb, getCtx, handle, HttpError } from '@/lib/server';
import { toEmail } from '@/lib/util';

export const POST = handle(async (req) => {
  const ctx = await getCtx(req, { owner: true });
  const { name, loginId, password } = await req.json();
  if (!String(name ?? '').trim() || !String(loginId ?? '').trim()) throw new HttpError(400, 'Enter a name and login ID');
  if (String(password ?? '').length < 6) throw new HttpError(400, 'Password must be at least 6 characters');
  const user = await adminAuth
    .createUser({ email: toEmail(loginId), password, displayName: name.trim() })
    .catch((e) => { throw new HttpError(e.code === 'auth/email-already-exists' ? 409 : 400, e.code === 'auth/email-already-exists' ? 'That login ID is taken' : 'Could not create the member'); });
  await adminAuth.setCustomUserClaims(user.uid, { role: 'member' });
  await adminDb.doc(`users/${user.uid}`).set({
    name: name.trim(), loginId: loginId.trim().toLowerCase(), role: 'member', active: true, createdBy: ctx.uid, createdAt: FieldValue.serverTimestamp(),
  });
  return { uid: user.uid };
});

// Activate/deactivate and/or reset password
export const PATCH = handle(async (req) => {
  await getCtx(req, { owner: true });
  const { uid, active, password } = await req.json();
  const snap = await adminDb.doc(`users/${uid}`).get();
  if (snap.data()?.role !== 'member') throw new HttpError(400, 'Not a member');
  if (typeof active === 'boolean') {
    await adminAuth.updateUser(uid, { disabled: !active });
    await adminDb.doc(`users/${uid}`).update({ active });
    if (!active) await adminAuth.revokeRefreshTokens(uid);
  }
  if (password) {
    if (String(password).length < 6) throw new HttpError(400, 'Password must be at least 6 characters');
    await adminAuth.updateUser(uid, { password });
  }
  return { ok: true };
});
