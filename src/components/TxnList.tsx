import { inr } from '@/lib/util';
export default function TxnList({ items, owner, onEdit, onDelete }: { items: any[]; owner: boolean; onEdit: (t: any) => void; onDelete: (t: any) => void }) {
  if (!items.length) return <p className="empty">No transactions yet. Tap + to add the first one.</p>;
  return (
    <ul className="rows">
      {items.map((t) => (
        <li key={t.id}>
          <div className="grow">
            <b>{t.particulars}</b>
            <small>
              {t.mode === 'ONLINE' ? t.onlineMethod : 'Cash'} · {t.createdByName}
              {t.createdAt?.toDate ? ' · ' + t.createdAt.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
            </small>
            {owner && (
              <span className="acts noprint">
                <button onClick={() => onEdit(t)}>Edit</button>
                <button onClick={() => onDelete(t)}>Delete</button>
              </span>
            )}
          </div>
          <span className={'amt ' + (t.type === 'IN' ? 'in' : 'out')}>{t.type === 'IN' ? '+' : '−'}{inr(t.amount)}</span>
        </li>
      ))}
    </ul>
  );
}
