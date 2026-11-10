'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { downloadCsv, ledgerText, shareText } from '@/lib/util';
import Summary from './Summary';
import TxnList from './TxnList';
import TxnForm from './TxnForm';
import Filters, { applyFilters, isFiltered, noFilter } from './Filters';

export default function Today() {
  const { role, today } = useAuth();
  const owner = role === 'owner';
  const [items, setItems] = useState<any[]>([]);
  const [f, setF] = useState(noFilter);
  const [form, setForm] = useState<any>(null);

  useEffect(() => onSnapshot(
    query(collection(db, 'ledgers', today, 'transactions'), orderBy('createdAt', 'desc')),
    (s) => setItems(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
    () => setItems([]),
  ), [today]);

  const shown = applyFilters(items, f);
  const del = async (t: any) => {
    if (confirm(`Delete "${t.particulars}"?`)) await api('DELETE', `/api/transactions?date=${t.date}&id=${t.id}`).catch((e) => alert(e.message));
  };
  return (
    <>
      <Summary items={shown} />
      {isFiltered(f) && <p className="note">Totals cover the filtered rows only.</p>}
      <Filters f={f} set={setF} />
      <TxnList items={shown} owner={owner} onEdit={(t) => setForm(t)} onDelete={del} />
      {owner && (
        <div className="row-gap noprint">
          <button className="ghost" onClick={() => shareText(ledgerText(today, shown))} disabled={!shown.length}>Share</button>
          <button className="ghost" onClick={() => downloadCsv(`ledger-${today}.csv`, shown)} disabled={!shown.length}>Export CSV</button>
          <button className="ghost" onClick={() => window.print()} disabled={!shown.length}>Print / PDF</button>
        </div>
      )}
      <button className="fab noprint" aria-label="Add transaction" onClick={() => setForm({})}>+</button>
      {form && <TxnForm owner={owner} today={today} initial={form.id ? form : undefined} onClose={() => setForm(null)} />}
    </>
  );
}
