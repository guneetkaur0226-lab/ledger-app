export type F = { type: string; mode: string; method: string; min: string; max: string; q: string };
export const noFilter: F = { type: '', mode: '', method: '', min: '', max: '', q: '' };
export const isFiltered = (f: F) => Object.values(f).some(Boolean);
export const applyFilters = (items: any[], f: F) =>
  items.filter((t) =>
    (!f.type || t.type === f.type) && (!f.mode || t.mode === f.mode) && (!f.method || t.onlineMethod === f.method) &&
    (!f.min || t.amount >= Math.round(parseFloat(f.min) * 100)) && (!f.max || t.amount <= Math.round(parseFloat(f.max) * 100)) &&
    (!f.q || t.particulars.toLowerCase().includes(f.q.toLowerCase())));

export default function Filters({ f, set }: { f: F; set: (f: F) => void }) {
  const u = (k: keyof F) => (e: any) => set({ ...f, [k]: e.target.value });
  return (
    <section className="filters noprint">
      <select value={f.type} onChange={u('type')}><option value="">IN + OUT</option><option value="IN">IN</option><option value="OUT">OUT</option></select>
      <select value={f.mode} onChange={u('mode')}><option value="">Cash + Online</option><option value="CASH">Cash</option><option value="ONLINE">Online</option></select>
      <select value={f.method} onChange={u('method')}><option value="">Any method</option><option value="PAYTM">PayTM</option><option value="UPI">UPI</option><option value="NETBANKING">NetBanking</option></select>
      <input placeholder="Min ₹" inputMode="decimal" value={f.min} onChange={u('min')} />
      <input placeholder="Max ₹" inputMode="decimal" value={f.max} onChange={u('max')} />
      <input placeholder="Search particulars" value={f.q} onChange={u('q')} />
    </section>
  );
}
