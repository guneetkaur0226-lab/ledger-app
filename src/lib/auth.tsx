'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { todayIST } from './util';

export function useToday() {
  const [t, setT] = useState(todayIST());
  useEffect(() => { const i = setInterval(() => setT(todayIST()), 30000); return () => clearInterval(i); }, []);
  return t;
}
type S = { ready: boolean; user: User | null; role: string | null; profile: any; absent: boolean; today: string };
const C = createContext<S>({ ready: false, user: null, role: null, profile: undefined, absent: false, today: '' });
export const useAuth = () => useContext(C);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const today = useToday();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(undefined);
  const [absent, setAbsent] = useState(false);

  useEffect(() => onAuthStateChanged(auth, async (u) => {
    setUser(u);
    if (u) setRole(((await u.getIdTokenResult()).claims.role as string) || null);
    else { setRole(null); setProfile(undefined); setAbsent(false); }
    setReady(true);
  }), []);
  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, 'users', user.uid), (s) => setProfile(s.exists() ? s.data() : null), () => setProfile(null));
  }, [user]);
  useEffect(() => {
    if (!user || role !== 'member') { setAbsent(false); return; }
    return onSnapshot(doc(db, 'attendance', today, 'records', user.uid), (s) => setAbsent(s.exists()), () => setAbsent(false));
  }, [user, role, today]);

  return <C.Provider value={{ ready, user, role, profile, absent, today }}>{children}</C.Provider>;
}
