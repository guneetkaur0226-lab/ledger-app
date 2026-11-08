import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, getCtx, handle, HttpError } from '@/lib/server';
import { isDate } from '@/lib/util';

const clean = (b: any) => ({ title: String(b.title ?? '').trim().slice(0, 80), notes: String(b.notes ?? '').trim().slice(0, 500) });

export const POST = handle(async (req) => {
  const ctx = await getCtx(req, { owner: true });
  const b = await req.json();
  if (!isDate(b.date)) throw new HttpError(400, 'Pick a valid date');
  const ref = adminDb.doc(`ledgers/${b.date}`);
  if ((await ref.get()).exists) throw new HttpError(409, 'A ledger for this date already exists');
  await ref.set({ date: b.date, ...clean(b), createdBy: ctx.uid, createdAt: FieldValue.serverTimestamp() });
  return { ok: true };
});

export const PATCH = handle(async (req) => {
  await getCtx(req, { owner: true });
  const b = await req.json();
  if (!isDate(b.date)) throw new HttpError(400, 'Pick a valid date');
  await adminDb.doc(`ledgers/${b.date}`).set(clean(b), { merge: true });
  return { ok: true };
});

// Deletes the ledger and every transaction in it
export const DELETE = handle(async (req) => {
  await getCtx(req, { owner: true });
  const date = req.nextUrl.searchParams.get('date');
  if (!isDate(date)) throw new HttpError(400, 'Pick a valid date');
  await adminDb.recursiveDelete(adminDb.doc(`ledgers/${date}`));
  return { ok: true };
});
