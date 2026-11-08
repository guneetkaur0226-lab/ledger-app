import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, getCtx, handle, HttpError, notifyTxn } from '@/lib/server';
import { isDate, todayIST, validateTxn } from '@/lib/util';

// Create. Members: today only. Owner: any date. The ledger for that date is created on the first entry.
export const POST = handle(async (req) => {
  const ctx = await getCtx(req);
  const body = await req.json();
  const today = todayIST();
  if (ctx.role === 'member' && body.date && body.date !== today) throw new HttpError(403, 'Members can only add entries for today');
  const date = ctx.role === 'owner' ? body.date : today;
  const v = validateTxn({ ...body, date });
  if (!v.ok) throw new HttpError(400, v.error);

  const ledger = adminDb.doc(`ledgers/${date}`);
  const ref = ledger.collection('transactions').doc();
  await adminDb.runTransaction(async (t) => {
    if (!(await t.get(ledger)).exists) t.set(ledger, { date, createdBy: ctx.uid, createdAt: FieldValue.serverTimestamp() });
    t.set(ref, { ...v.data, createdBy: ctx.uid, createdByName: ctx.name, createdAt: FieldValue.serverTimestamp() });
  });
  await notifyTxn(ctx.uid, v.data, ctx.name).catch((e) => console.error('notify failed', e));
  return { id: ref.id };
});

// Edit (owner only). The date of a transaction cannot be changed.
export const PUT = handle(async (req) => {
  const ctx = await getCtx(req, { owner: true });
  const body = await req.json();
  const v = validateTxn(body);
  if (!v.ok) throw new HttpError(400, v.error);
  const ref = adminDb.doc(`ledgers/${v.data.date}/transactions/${body.id}`);
  if (!(await ref.get()).exists) throw new HttpError(404, 'Transaction not found');
  await ref.update({ ...v.data, updatedBy: ctx.uid, updatedAt: FieldValue.serverTimestamp() });
  return { ok: true };
});

// Delete (owner only)
export const DELETE = handle(async (req) => {
  await getCtx(req, { owner: true });
  const date = req.nextUrl.searchParams.get('date');
  const id = req.nextUrl.searchParams.get('id');
  if (!isDate(date) || !id) throw new HttpError(400, 'Missing date or id');
  await adminDb.doc(`ledgers/${date}/transactions/${id}`).delete();
  return { ok: true };
});
