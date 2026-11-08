export const METHODS = ['PAYTM', 'UPI', 'NETBANKING'];
export const todayIST = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
export const shiftDays = (d: string, n: number) =>
  new Date(new Date(d + 'T00:00:00Z').getTime() + n * 86400000).toISOString().slice(0, 10);
export const isDate = (s: any) =>
  typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  !isNaN(Date.parse(s + 'T00:00:00Z')) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;
export const toEmail = (id: string) => {
  const v = id.trim().toLowerCase();
  return v.includes('@') ? v : `${v}@ledger.invalid`;
};
export const inr = (paise: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((paise || 0) / 100);
export const fmtDate = (d: string) =>
  new Date(d + 'T00:00:00+05:30').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
export function sums(items: any[]) {
  let i = 0, o = 0;
  for (const t of items) t.type === 'IN' ? (i += t.amount) : (o += t.amount);
  return { in: i, out: o, net: i - o };
}
type V = { ok: boolean; error?: string; data?: any };
export function validateTxn(b: any): V {
  const bad = (error: string): V => ({ ok: false, error });
  const particulars = String(b.particulars ?? '').trim();
  if (!isDate(b.date)) return bad('Pick a valid date');
  if (!particulars) return bad('Add particulars');
  if (particulars.length > 200) return bad('Particulars can be at most 200 characters');
  if (!Number.isInteger(b.amount) || b.amount <= 0 || b.amount > 1e11) return bad('Enter an amount greater than 0');
  if (!['IN', 'OUT'].includes(b.type)) return bad('Choose IN or OUT');
  if (!['CASH', 'ONLINE'].includes(b.mode)) return bad('Choose Cash or Online');
  if (b.mode === 'ONLINE') {
    if (b.type !== 'IN') return bad('Online payments can only be received (IN)');
    if (!METHODS.includes(b.onlineMethod)) return bad('Choose PayTM, UPI or NetBanking');
  }
  return {
    ok: true,
    data: { date: b.date, particulars, amount: b.amount, type: b.type, mode: b.mode, onlineMethod: b.mode === 'ONLINE' ? b.onlineMethod : null },
  };
}
export function downloadCsv(name: string, items: any[]) {
  const head = ['Date', 'Particulars', 'Type', 'Mode', 'Method', 'Amount (INR)', 'Added by'];
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = items.map((t) => [t.date, t.particulars, t.type, t.mode, t.onlineMethod || '', (t.amount / 100).toFixed(2), t.createdByName]);
  const csv = [head, ...rows].map((r) => r.map(esc).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv' }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
