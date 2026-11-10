'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { api } from '@/lib/api';

export default function Members() {
  const [members, setMembers] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => onSnapshot(collection(db, 'members'),
    (s) => setMembers(s.docs.map((d) => ({ key: d.id, ...d.data() })).sort((a: any, b: any) => a.name.localeCompare(b.name)))), []);

  async function add(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    try { await api('POST', '/api/members', { name, email }); setName(''); setEmail(''); }
    catch (x: any) { setErr(x.message); }
  }
  const run = (fn: () => Promise<any>) => fn().catch((e) => alert(e.message));
  return (
    <>
      <form className="card" onSubmit={add}>
        <h2>Allow a member</h2>
        <small>They sign in with this Google email. Nobody else can get in.</small>
        <label>Name<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
        <label>Google email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoCapitalize="none" required /></label>
        {err && <p className="err">{err}</p>}
        <button className="btn">Add member</button>
      </form>
      {!members.length && <p className="empty">No members yet.</p>}
      <ul className="rows">
        {members.map((m) => (
          <li key={m.key}>
            <div className="grow">
              <b>{m.name}</b>
              <small>{m.email} · {!m.active ? 'Paused' : m.uid ? 'Signed in before' : 'Not signed in yet'}</small>
              <span className="acts">
                <button onClick={() => run(() => api('PATCH', '/api/members', { key: m.key, active: !m.active }))}>{m.active ? 'Pause access' : 'Restore access'}</button>
                <button onClick={() => { if (confirm(`Remove ${m.name}'s access? They will be signed out and must be added again to return.`)) run(() => api('DELETE', `/api/members?key=${encodeURIComponent(m.key)}`)); }}>Remove</button>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
