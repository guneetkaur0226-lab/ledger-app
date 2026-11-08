'use client';
import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AuthProvider, useAuth } from '@/lib/auth';
import { enablePush } from '@/lib/push';
import { fmtDate } from '@/lib/util';
import Login from '@/components/Login';
import Today from '@/components/Today';
import History from '@/components/History';
import Attendance from '@/components/Attendance';
import Members from '@/components/Members';

function Blocked({ title, text }: { title: string; text: string }) {
  return (
    <div className="center">
      <h1>{title}</h1>
      <p>{text}</p>
      <button className="btn" onClick={() => signOut(auth)}>Sign out</button>
    </div>
  );
}

function Shell() {
  const { role, profile, today } = useAuth();
  const owner = role === 'owner';
  const tabs = owner ? ['Today', 'History', 'Attendance', 'Members'] : ['Today'];
  const [tab, setTab] = useState('Today');
  const [msg, setMsg] = useState('');
  return (
    <div className="shell">
      <header className="top noprint">
        <div>
          <b className="brand">Daily Ledger</b>
          <small>{profile.name} · {fmtDate(today)}</small>
        </div>
        <div className="row-gap">
          <button className="ghost" onClick={async () => setMsg(await enablePush().catch((e) => e.message))}>Alerts</button>
          <button className="ghost" onClick={() => signOut(auth)}>Sign out</button>
        </div>
      </header>
      {msg && <p className="note" onClick={() => setMsg('')}>{msg}</p>}
      <main>
        {tab === 'Today' && <Today />}
        {owner && tab === 'History' && <History />}
        {owner && tab === 'Attendance' && <Attendance />}
        {owner && tab === 'Members' && <Members />}
      </main>
      {owner && (
        <nav className="tabs noprint">
          {tabs.map((t) => <button key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>)}
        </nav>
      )}
    </div>
  );
}

function Gate() {
  const { ready, user, role, profile, absent } = useAuth();
  if (!ready || (user && profile === undefined)) return <div className="center">Loading…</div>;
  if (!user) return <Login />;
  if (!role || !profile) return <Blocked title="Account not set up" text="Ask the owner to check this account." />;
  if (!profile.active) return <Blocked title="Account disabled" text="Ask the owner to turn it back on." />;
  if (role === 'member' && absent) return <Blocked title="You are on holiday mode. Enjoy :)" text="" />;
  return <Shell />;
}

export default function Page() {
  return <AuthProvider><Gate /></AuthProvider>;
}
