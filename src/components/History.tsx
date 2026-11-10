'use client';
import { useEffect, useState } from 'react';
import { collection, collectionGroup, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { downloadCsv, fmtDate, inr, ledgerText, shareText, shiftDays, sums } from '@/lib/util';
import TxnList from './TxnList';
import TxnForm from './TxnForm';
import Filters, { applyFilters, isFiltered, noFilter } from './Filters';

export default function History() {
  const { today } = useAuth();
  const [from, setFrom] = useState(shiftDays(today, -6));
  const [to, setTo] = useState(today);
  const [f, setF] = useState(noFilter);
  const [txns, setTxns] = useState<any[]>([]);
  const [ledgers, setLedgers] = useState<Record<string, any>>({});
  const [form, setForm] = useState<any>(null);
  const [newDate, setNewDate] = useState(today);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const [t, l] = await Promise.all([
        getDocs(query(collectionGroup(db, 'transactions'), where('date', '>=', from), where('date', '<=', to), orderBy('date', 'desc'))),
        getDocs(query(collection(db, 'ledgers'), where('date', '>=', from), where('date', '<=', to))),
      ]);
      setTxns(t.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)));
      setLedgers(Object.fromEntries(l.docs.map((d) => [d.id, d.data()])));
    } catch (e: any) { alert(e.message); }
    finally { setBusy(false); }
  }
  useEffect(() => { run(); }, []);

  const shown = applyFilters(txns, f);
  const dates = Array.from(new Set([...shown.map((t) => t.date), ...(isFiltered(f) ? [] : Object.keys(ledgers))])).sort().reverse();
  const act = async (fn: () => Promise<any>) => { try { await fn(); await run(); } catch (e: any) { alert(e.message); } };

  async function purgeAll() {
    if (!confirm('This permanently deletes EVERY ledger and transaction. It cannot be undone.')) return;
    if (prompt('Type DELETE to confirm') !== 'DELETE') return;
    await act(() => api('DELETE', '/api/ledgers?all=true&confirm=DELETE'));
  }

  return (
    <>
      <section className="filters noprint">
        <label>From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label>To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <button className="btn" onClick={run} disabled={busy}>{busy ? 'Loading…' : 'Show'}</button>
      </section>
      <Filters f={f} set={setF} />
      <div className="row-gap noprint">
        <button className="ghost" onClick={() => downloadCsv(`ledger-${from}-to-${to}.csv`, shown)} disabled={!shown.length}>Export CSV</button>
        <button className="ghost" onClick={() => window.print()} disabled={!shown.length}>Print / PDF</button>
      </div>
      <section className="filters noprint">
        <label>New ledger date<input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} /></label>
        <button className="ghost" onClick={() => act(() => api('POST', '/api/ledgers', { date: newDate }))}>Create ledger</button>
        <button className="ghost" onClick={() => setForm({})}>Add transaction</button>
      </section>
      {!dates.length && <p className="empty">No ledgers in this range.</p>}
      {dates.map((d) => {
        const rows = shown.filter((t) => t.date === d);
        const s = sums(rows);
        return (
          <section key={d} className="day">
            <header>
              <div><b>{fmtDate(d)}</b>{ledgers[d]?.title && <small> · {ledgers[d].title}</small>}</div>
              <span className="tot"><span className="in">{inr(s.in)}</span> / <span className="out">{inr(s.out)}</span> = <b>{inr(s.net)}</b></span>
            </header>
            <div className="acts noprint">
              <button onClick={() => shareText(ledgerText(d, rows))}>Share</button>
              <button onClick={() => { const title = prompt('Ledger title', ledgers[d]?.title ?? ''); if (title !== null) act(() => api('PATCH', '/api/ledgers', { date: d, title, notes: ledgers[d]?.notes ?? '' })); }}>Rename</button>
              <button onClick={() => { if (confirm(`Delete the ledger for ${fmtDate(d)} and all ${txns.filter((t) => t.date === d).length} transactions?`)) act(() => api('DELETE', `/api/ledgers?date=${d}`)); }}>Delete ledger</button>
            </div>
            <TxnList items={rows} owner onEdit={(t) => setForm(t)}
              onDelete={(t) => { if (confirm(`Delete "${t.particulars}"?`)) act(() => api('DELETE', `/api/transactions?date=${t.date}&id=${t.id}`)); }} />
          </section>
        );
      })}
      <section className="danger noprint">
        <small>Danger zone</small>
        <button onClick={purgeAll}>Delete all ledger history</button>
      </section>
      {form && <TxnForm owner today={today} initial={form.id ? form : undefined} onClose={() => { setForm(null); run(); }} />}
    </>
  );
}
