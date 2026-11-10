import { inr, sums } from '@/lib/util';

// show = the Cash/Online filter: hides the net that no longer applies.
export default function Summary({ items, show = '' }: { items: any[]; show?: string }) {
  const s = sums(items);
  const cash = sums(items.filter((t) => t.mode !== 'ONLINE'));
  const online = sums(items.filter((t) => t.mode === 'ONLINE'));
  return (
    <section className="sum">
      <div><small>In</small><b className="in">{inr(s.in)}</b></div>
      <div><small>Out</small><b className="out">{inr(s.out)}</b></div>
      <div className="net"><small>Net</small><b>{inr(s.net)}</b></div>
      {show !== 'ONLINE' && <div className="sub"><small>Net cash</small><b className={cash.net < 0 ? 'out' : ''}>{inr(cash.net)}</b></div>}
      {show !== 'CASH' && <div className="sub"><small>Net online</small><b className={online.net < 0 ? 'out' : ''}>{inr(online.net)}</b></div>}
    </section>
  );
}
