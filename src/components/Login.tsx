'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { googleSignIn } from '@/lib/native';

export default function Login() {
  const { accessError, clearError } = useAuth();
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true); setErr(''); clearError();
    try { await googleSignIn(); }
    catch (e: any) { if (!/cancel|closed|dismiss/i.test(String(e?.code || e?.message))) setErr('Google sign-in failed. Try again.'); }
    finally { setBusy(false); }
  }
  return (
    <div className="center login">
      <img src="/icon-192.png" alt="" width={84} height={84} style={{ borderRadius: 20, alignSelf: 'center' }} />
      <h1 style={{ textAlign: 'center' }}>Daily Ledger</h1>
      <button className="btn google" onClick={go} disabled={busy}>{busy ? 'Opening Google…' : 'Sign in with Google'}</button>
      {(accessError || err) && <p className="err">{accessError || err}</p>}
      <small>Only accounts approved by the owner can sign in.</small>
    </div>
  );
}
