import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb, handle, HttpError, verifyReq } from '@/lib/server';
import { normEmail, OWNER_EMAIL } from '@/lib/util';

// Called right after every Google sign-in. Decides who gets in and stamps their role onto the token.
export const POST = handle(async (req) => {
  const d = await verifyReq(req);
  const email = String(d.email || '').toLowerCase();
  const key = normEmail(email);
  // Anyone not on the allow-list is signed out by the app and their Firebase account is removed.
  const deny = async (msg: string): Promise<never> => { await adminAuth.deleteUser(d.uid).catch(() => {}); throw new HttpError(403, msg); };

  if (!d.email_verified || d.firebase?.sign_in_provider !== 'google.com') return deny('Sign in with a verified Google account.');

  let role: 'owner' | 'member';
  let name: string;
  if (key === normEmail(OWNER_EMAIL)) { role = 'owner'; name = d.name || 'Owner'; }
  else {
    const m = await adminDb.doc(`members/${key}`).get();
    if (!m.exists || !m.data()!.active) return deny('This Google account is not allowed. Ask the owner to add your email.');
    role = 'member'; name = m.data()!.name || d.name || email;
  }
  const claims: any = role === 'owner' ? { role } : { role, mk: key };
  if (d.role !== claims.role || d.mk !== claims.mk) await adminAuth.setCustomUserClaims(d.uid, claims);
  await adminDb.doc(`users/${d.uid}`).set({ name, email, role, key, active: true }, { merge: true });
  if (role === 'member') await adminDb.doc(`members/${key}`).update({ uid: d.uid, lastLogin: FieldValue.serverTimestamp() });
  return { role };
});
