'use client';
import { useEffect, useState } from 'react';
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
import Guard from '@/components/Guard';

function Blocked({ title, text }: { title: string; text: string }) {
  return (
    <div className="center">
      <h1>{title}</h1>
      {text && <p>{text}</p>}
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

  // Anyone who is not the owner: no copy, no context menu, nothing printable.
  useEffect(() => {
    if (owner) return;
    const stop = (e: Event) => e.preventDefault();
    document.body.classList.add('member');
    document.addEventListener('contextmenu', stop);
    document.addEventListener('copy', stop);
    return () => { document.body.classList.remove('member'); document.removeEventListener('contextmenu', stop); document.removeEventListener('copy', stop); };
  }, [owner]);

  return (
    <div className="shell">
      {!owner && <Guard label={`${profile.name} · ${profile.email}`} />}
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
  if (profile.active === false) return <Blocked title="Access paused" text="Ask the owner to restore your access." />;
  if (role === 'member' && absent) return <Blocked title="You are on holiday mode. Enjoy :)" text="" />;
  return <Shell />;
}

export default function Page() {
  return <AuthProvider><Gate /></AuthProvider>;
}
