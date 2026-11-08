'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function Attendance() {
  const { today } = useAuth();
  const [date, setDate] = useState(today);
  const [members, setMembers] = useState<any[]>([]);
  const [absent, setAbsent] = useState<Set<string>>(new Set());
  useEffect(() => onSnapshot(query(collection(db, 'users'), where('role', '==', 'member')),
    (s) => setMembers(s.docs.map((d) => ({ uid: d.id, ...d.data() })).filter((m: any) => m.active))), []);
  useEffect(() => onSnapshot(collection(db, 'attendance', date, 'records'), (s) => setAbsent(new Set(s.docs.map((d) => d.id)))), [date]);
  const toggle = (uid: string, isAbsent: boolean) => api('POST', '/api/attendance', { date, uid, absent: isAbsent }).catch((e) => alert(e.message));
  return (
    <>
      <section className="filters"><label>Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label></section>
      {!members.length && <p className="empty">No members yet. Add one in the Members tab.</p>}
      <ul className="rows">
        {members.map((m) => (
          <li key={m.uid}>
            <div className="grow"><b>{m.name}</b><small>{absent.has(m.uid) ? 'Absent: locked out of the app' : 'Present'}</small></div>
            <div className="seg slim">
              <button className={!absent.has(m.uid) ? 'on in' : ''} onClick={() => toggle(m.uid, false)}>Present</button>
              <button className={absent.has(m.uid) ? 'on out' : ''} onClick={() => toggle(m.uid, true)}>Absent</button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
