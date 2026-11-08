'use client';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toEmail } from '@/lib/util';

export default function Login() {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr('');
    try { await signInWithEmailAndPassword(auth, toEmail(id), pw); }
    catch { setErr('Login ID or password is wrong.'); }
    finally { setBusy(false); }
  }
  return (
    <form className="center login" onSubmit={submit}>
      <h1>Daily Ledger</h1>
      <label>Login ID<input value={id} onChange={(e) => setId(e.target.value)} autoCapitalize="none" autoComplete="username" required /></label>
      <label>Password<input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required /></label>
      {err && <p className="err">{err}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
}
