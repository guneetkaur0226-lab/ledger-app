'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { api } from './api';
import { todayIST } from './util';

export function useToday() {
  const [t, setT] = useState(todayIST());
  useEffect(() => { const i = setInterval(() => setT(todayIST()), 30000); return () => clearInterval(i); }, []);
  return t;
}
type S = { ready: boolean; user: User | null; role: string | null; key: string | null; profile: any; absent: boolean; today: string; accessError: string; clearError: () => void };
const C = createContext<S>({ ready: false, user: null, role: null, key: null, profile: undefined, absent: false, today: '', accessError: '', clearError: () => {} });
export const useAuth = () => useContext(C);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const today = useToday();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [key, setKey] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(undefined);
  const [absent, setAbsent] = useState(false);
  const [accessError, setAccessError] = useState('');

  useEffect(() => onAuthStateChanged(auth, async (u) => {
    if (!u) { setUser(null); setRole(null); setKey(null); setProfile(undefined); setAbsent(false); setReady(true); return; }
    setReady(false);
    try {
      await api('POST', '/api/session'); // allow-list check; stamps role onto the token
      const r = await u.getIdTokenResult(true);
      setRole((r.claims.role as string) || null);
      setKey((r.claims.mk as string) || null);
      setAccessError('');
      setUser(u);
      setReady(true);
    } catch (e: any) {
      setAccessError(e.message || 'Access denied');
      await signOut(auth);
    }
  }), []);
  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, 'users', user.uid), (s) => setProfile(s.exists() ? s.data() : null), () => setProfile(null));
  }, [user]);
  useEffect(() => {
    if (!user || role !== 'member' || !key) { setAbsent(false); return; }
    return onSnapshot(doc(db, 'attendance', today, 'records', key), (s) => setAbsent(s.exists()), () => setAbsent(false));
  }, [user, role, key, today]);

  return <C.Provider value={{ ready, user, role, key, profile, absent, today, accessError, clearError: () => setAccessError('') }}>{children}</C.Provider>;
}
