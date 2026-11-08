import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, getCtx, handle, HttpError } from '@/lib/server';

export const POST = handle(async (req) => {
  const ctx = await getCtx(req);
  const { token } = await req.json();
  if (!token) throw new HttpError(400, 'Missing token');
  await adminDb.doc(`users/${ctx.uid}/devices/${token}`).set({ updatedAt: FieldValue.serverTimestamp() });
  return { ok: true };
});
