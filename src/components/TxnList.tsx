import { sums } from '@/lib/util';

// Cash: whole rupees drop the ".00" to keep the columns narrow. Online (full = true): always two decimals.
const money = (p: number, full = false) => {
  const d = full || p % 100 !== 0 ? 2 : 0;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: d, maximumFractionDigits: d }).format(p / 100);
};

export default function TxnList({ items, owner, show = '', onEdit, onDelete }: { items: any[]; owner: boolean; show?: string; onEdit: (t: any) => void; onDelete: (t: any) => void }) {
  if (!items.length) return <p className="empty">No transactions yet. Tap + to add the first one.</p>;
  const showCash = show !== 'ONLINE';   // filter = Online hides Cash In / Cash Out
  const showOnline = show !== 'CASH';   // filter = Cash hides Online
  const cash = items.filter((t) => t.mode !== 'ONLINE');
  const online = items.filter((t) => t.mode === 'ONLINE');
  const c = sums(cash);
  const o = sums(online);
  return (
    <div className="tbl">
      <table>
        <thead>
          <tr>
            <th>Particulars</th>
            {showCash && <th className="c">Cash In</th>}
            {showCash && <th className="c">Cash Out</th>}
            {showOnline && <th className="c">Online</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((t) => {
            const isCash = t.mode !== 'ONLINE';
            return (
              <tr key={t.id}>
                <td>
                  <b>{t.particulars}</b>
                  <small>
                    {t.createdByName}
                    {t.createdAt?.toDate ? ' · ' + t.createdAt.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </small>
                  {owner && (
                    <span className="acts noprint">
                      <button onClick={() => onEdit(t)}>Edit</button>
                      <button onClick={() => onDelete(t)}>Delete</button>
                    </span>
                  )}
                </td>
                {showCash && <td className="c in">{isCash && t.type === 'IN' && '+' + money(t.amount)}</td>}
                {showCash && <td className="c out">{isCash && t.type === 'OUT' && '−' + money(t.amount)}</td>}
                {showOnline && <td className={'c ' + (t.type === 'IN' ? 'in' : 'out')}>{!isCash && (t.type === 'IN' ? '+' : '−') + money(t.amount, true)}</td>}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td>Total</td>
            {showCash && <td className="c in">{money(c.in)}</td>}
            {showCash && <td className="c out">{money(c.out)}</td>}
            {showOnline && <td className="c in">{money(o.net, true)}</td>}
          </tr>
          {showCash && (
            <tr>
              <td>Net cash</td>
              <td className={'c ' + (c.net < 0 ? 'out' : 'in')} colSpan={2}>{money(c.net)}</td>
              {showOnline && <td className="c"></td>}
            </tr>
          )}
        </tfoot>
      </table>
    </div>
  );
}
