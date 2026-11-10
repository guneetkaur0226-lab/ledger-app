'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function Attendance() {
  const { today } = useAuth();
  const [date, setDate] = useState(today);
  const [members, setMembers] = useState<any[]>([]);
  const [absent, setAbsent] = useState<Set<string>>(new Set());
  useEffect(() => onSnapshot(collection(db, 'members'),
    (s) => setMembers(s.docs.map((d) => ({ key: d.id, ...d.data() })).filter((m: any) => m.active))), []);
  useEffect(() => onSnapshot(collection(db, 'attendance', date, 'records'), (s) => setAbsent(new Set(s.docs.map((d) => d.id)))), [date]);
  const toggle = (key: string, isAbsent: boolean) => api('POST', '/api/attendance', { date, key, absent: isAbsent }).catch((e) => alert(e.message));
  return (
    <>
      <section className="filters"><label>Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label></section>
      {!members.length && <p className="empty">No members yet. Add one in the Members tab.</p>}
      <ul className="rows">
        {members.map((m) => (
          <li key={m.key}>
            <div className="grow"><b>{m.name}</b><small>{absent.has(m.key) ? 'Absent: locked out of the app' : 'Present'}</small></div>
            <div className="seg slim">
              <button className={!absent.has(m.key) ? 'on in' : ''} onClick={() => toggle(m.key, false)}>Present</button>
              <button className={absent.has(m.key) ? 'on out' : ''} onClick={() => toggle(m.key, true)}>Absent</button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
