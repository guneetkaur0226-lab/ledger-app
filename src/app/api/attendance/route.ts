import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, getCtx, handle, HttpError } from '@/lib/server';
import { isDate } from '@/lib/util';

// Only absences are stored; no record means Present.
export const POST = handle(async (req) => {
  const ctx = await getCtx(req, { owner: true });
  const { date, key, absent } = await req.json();
  if (!isDate(date) || !key) throw new HttpError(400, 'Missing date or member');
  if (!(await adminDb.doc(`members/${key}`).get()).exists) throw new HttpError(400, 'Attendance applies to members only');
  const ref = adminDb.doc(`attendance/${date}/records/${key}`);
  if (absent) await ref.set({ status: 'ABSENT', markedBy: ctx.uid, markedAt: FieldValue.serverTimestamp() });
  else await ref.delete();
  return { ok: true };
});
