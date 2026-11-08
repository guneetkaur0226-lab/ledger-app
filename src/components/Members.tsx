'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { api } from '@/lib/api';

export default function Members() {
  const [members, setMembers] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => onSnapshot(query(collection(db, 'users'), where('role', '==', 'member')),
    (s) => setMembers(s.docs.map((d) => ({ uid: d.id, ...d.data() })))), []);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    try { await api('POST', '/api/members', { name, loginId, password }); setName(''); setLoginId(''); setPassword(''); }
    catch (x: any) { setErr(x.message); }
  }
  const patch = (body: any) => api('PATCH', '/api/members', body).catch((e) => alert(e.message));
  return (
    <>
      <form className="card" onSubmit={create}>
        <h2>Add member</h2>
        <label>Name<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
        <label>Login ID<input value={loginId} onChange={(e) => setLoginId(e.target.value)} autoCapitalize="none" required /></label>
        <label>Password (6+ characters)<input value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></label>
        {err && <p className="err">{err}</p>}
        <button className="btn">Create member</button>
      </form>
      <ul className="rows">
        {members.map((m) => (
          <li key={m.uid}>
            <div className="grow">
              <b>{m.name}</b><small>{m.loginId} · {m.active ? 'Active' : 'Disabled'}</small>
              <span className="acts">
                <button onClick={() => patch({ uid: m.uid, active: !m.active })}>{m.active ? 'Disable' : 'Enable'}</button>
                <button onClick={() => { const p = prompt('New password (6+ characters)'); if (p) patch({ uid: m.uid, password: p }); }}>Reset password</button>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
