import { inr, sums } from '@/lib/util';

const Cell = ({ label, value, cls = '', fin = false }: { label: string; value: string; cls?: string; fin?: boolean }) => (
  <div className={'cell' + (fin ? ' fin' : '')}><span>{label}</span><b className={cls}>{value}</b></div>
);
const out = (p: number) => (p ? '−' + inr(p) : inr(0));
const sign = (n: number) => (n < 0 ? 'out' : '');

// Row 1: Cash In | Net Cash. Row 2: Cash Out | Net Online. Row 3: Final Balance.
// show = the Cash/Online filter; it hides what no longer applies. compact = no card, for the History date rows.
export default function Summary({ items, show = '', compact = false }: { items: any[]; show?: string; compact?: boolean }) {
  const all = sums(items);
  const cash = sums(items.filter((t) => t.mode !== 'ONLINE'));
  const online = sums(items.filter((t) => t.mode === 'ONLINE'));
  return (
    <section className={'sum' + (compact ? ' compact' : '')}>
      {show !== 'ONLINE' && <Cell label="Cash In" value={inr(cash.in)} cls="in" />}
      {show !== 'ONLINE' && <Cell label="Net Cash" value={inr(cash.net)} cls={sign(cash.net)} />}
      {show !== 'ONLINE' && <Cell label="Cash Out" value={out(cash.out)} cls="out" />}
      {show !== 'CASH' && <Cell label="Net Online" value={inr(online.net)} cls={sign(online.net)} />}
      <Cell label="Final Balance" value={inr(all.net)} cls={sign(all.net)} fin />
    </section>
  );
}
