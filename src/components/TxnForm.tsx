'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { validateTxn } from '@/lib/util';

export default function TxnForm({ owner, today, initial, onClose }: { owner: boolean; today: string; initial?: any; onClose: () => void }) {
  const editing = !!initial;
  const [date, setDate] = useState(initial?.date ?? today);
  const [particulars, setP] = useState(initial?.particulars ?? '');
  const [rupees, setR] = useState(initial ? String(initial.amount / 100) : '');
  const [type, setType] = useState<'IN' | 'OUT'>(initial?.type ?? 'IN');
  const [mode, setMode] = useState<'CASH' | 'ONLINE'>(initial?.mode ?? 'CASH');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = { date, particulars, amount: Math.round(parseFloat(rupees) * 100), type, mode };
    const v = validateTxn(body);
    if (!v.ok) return setErr(v.error);
    setBusy(true); setErr('');
    try {
      if (editing) await api('PUT', '/api/transactions', { ...body, id: initial.id });
      else await api('POST', '/api/transactions', body);
      onClose();
    } catch (x: any) { setErr(x.message); }
    finally { setBusy(false); }
  }
  return (
    <div className="modal" onClick={onClose}>
      <form className="sheet" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{editing ? 'Edit transaction' : 'New transaction'}</h2>
        {owner && !editing && <label>Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label>}
        <label>Particulars<input value={particulars} onChange={(e) => setP(e.target.value)} maxLength={200} required /></label>
        <label>Amount (₹)<input inputMode="decimal" value={rupees} onChange={(e) => setR(e.target.value)} placeholder="0.00" required /></label>
        <div className="seg">
          <button type="button" className={type === 'IN' ? 'on in' : ''} onClick={() => setType('IN')}>IN</button>
          <button type="button" className={type === 'OUT' ? 'on out' : ''} disabled={mode === 'ONLINE'} onClick={() => setType('OUT')}>OUT</button>
        </div>
        <div className="seg">
          <button type="button" className={mode === 'CASH' ? 'on' : ''} onClick={() => setMode('CASH')}>Cash</button>
          <button type="button" className={mode === 'ONLINE' ? 'on' : ''} disabled={type === 'OUT'} onClick={() => { setMode('ONLINE'); setType('IN'); }}>Online</button>
        </div>
        <small className="hint">Online payments can only be received (IN).</small>
        {err && <p className="err">{err}</p>}
        <div className="row-gap">
          <button type="button" className="ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}
