export const METHODS = ['PAYTM', 'UPI', 'NETBANKING'];
export const todayIST = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
export const shiftDays = (d: string, n: number) =>
  new Date(new Date(d + 'T00:00:00Z').getTime() + n * 86400000).toISOString().slice(0, 10);
export const isDate = (s: any) =>
  typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  !isNaN(Date.parse(s + 'T00:00:00Z')) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;
export const OWNER_EMAIL = 'bakshistock@gmail.com';
export const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
// Stable key for an email. Gmail ignores dots and +tags, so a.b+x@gmail.com and ab@gmail.com are the same account.
export function normEmail(email: string) {
  const [local, domain] = String(email).trim().toLowerCase().split('@');
  if (!domain) return '';
  if (domain === 'gmail.com' || domain === 'googlemail.com') return local.split('+')[0].replace(/\./g, '') + '@gmail.com';
  return `${local}@${domain}`;
}
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

export function ledgerText(date: string, items: any[]) {
  const t = sums(items);
  const lines = items.map((x) => `${x.type === 'IN' ? '+' : '-'}${inr(x.amount)} · ${x.particulars} (${x.mode === 'ONLINE' ? x.onlineMethod : 'Cash'})`);
  return [`Daily Ledger · ${fmtDate(date)}`, `In ${inr(t.in)} | Out ${inr(t.out)} | Net ${inr(t.net)}`, '', ...lines].join('\n');
}
// Owner only: system share sheet if the device has one, otherwise a WhatsApp link.
export async function shareText(text: string) {
  const nav: any = navigator;
  if (nav.share) {
    try { await nav.share({ text }); return; } catch (e: any) { if (e?.name === 'AbortError') return; }
  }
  window.open('https://wa.me/?text=' + encodeURIComponent(text.slice(0, 1800)), '_blank');
}
