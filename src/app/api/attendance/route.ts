import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, getCtx, handle, HttpError } from '@/lib/server';
import { isDate } from '@/lib/util';

// Only absences are stored; no record means Present.
export const POST = handle(async (req) => {
  const ctx = await getCtx(req, { owner: true });
  const { date, uid, absent } = await req.json();
  if (!isDate(date) || !uid) throw new HttpError(400, 'Missing date or member');
  const member = await adminDb.doc(`users/${uid}`).get();
  if (member.data()?.role !== 'member') throw new HttpError(400, 'Attendance applies to members only');
  const ref = adminDb.doc(`attendance/${date}/records/${uid}`);
  if (absent) await ref.set({ status: 'ABSENT', markedBy: ctx.uid, markedAt: FieldValue.serverTimestamp() });
  else await ref.delete();
  return { ok: true };
});
