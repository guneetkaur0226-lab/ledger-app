import { inr, sums } from '@/lib/util';
export default function Summary({ items }: { items: any[] }) {
  const s = sums(items);
  return (
    <section className="sum">
      <div><small>In</small><b className="in">{inr(s.in)}</b></div>
      <div><small>Out</small><b className="out">{inr(s.out)}</b></div>
      <div className="net"><small>Net</small><b>{inr(s.net)}</b></div>
    </section>
  );
}
