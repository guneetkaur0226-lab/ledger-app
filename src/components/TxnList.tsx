import { inr, sums } from '@/lib/util';

const Amt = ({ t }: { t: any }) => <span className={t.type === 'IN' ? 'in' : 'out'}>{t.type === 'IN' ? '+' : '−'}{inr(t.amount)}</span>;
const Net = ({ items }: { items: any[] }) => { const n = sums(items).net; return <span className={n < 0 ? 'out' : 'in'}>{inr(n)}</span>; };

export default function TxnList({ items, owner, onEdit, onDelete }: { items: any[]; owner: boolean; onEdit: (t: any) => void; onDelete: (t: any) => void }) {
  if (!items.length) return <p className="empty">No transactions yet. Tap + to add the first one.</p>;
  const cash = items.filter((t) => t.mode !== 'ONLINE');
  const online = items.filter((t) => t.mode === 'ONLINE');
  return (
    <div className="tbl">
      <table>
        <thead><tr><th>Particulars</th><th className="c">Cash</th><th className="c">Online</th></tr></thead>
        <tbody>
          {items.map((t) => (
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
              <td className="c">{t.mode !== 'ONLINE' && <Amt t={t} />}</td>
              <td className="c">{t.mode === 'ONLINE' && <Amt t={t} />}</td>
            </tr>
          ))}
        </tbody>
        <tfoot><tr><td>Net</td><td className="c"><Net items={cash} /></td><td className="c"><Net items={online} /></td></tr></tfoot>
      </table>
    </div>
  );
}
