import { createContext, useContext, useEffect, useState } from 'react';
import { api, token } from './api';

const Ctx = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [child, setChildState] = useState(() => { try { return JSON.parse(localStorage.getItem('thoth-child')); } catch { return null; } });
  useEffect(() => {
    if (!token.get()) { setReady(true); return; }
    api('/me').then(r => setUser(r.user)).catch(() => token.set(null)).finally(() => setReady(true));
  }, []);
  const setChild = c => { setChildState(c); c ? localStorage.setItem('thoth-child', JSON.stringify(c)) : localStorage.removeItem('thoth-child'); };
  const login = async (email, password, role) => { const r = await api('/auth/login', { method: 'POST', body: { email, password, role } }); token.set(r.token); setUser(r.user); return r.user; };
  const signup = async (email, password, name) => { const r = await api('/auth/signup', { method: 'POST', body: { email, password, name } }); token.set(r.token); setUser(r.user); return r.user; };
  const logout = () => { token.set(null); setUser(null); setChild(null); };
  return <Ctx.Provider value={{ user, ready, login, signup, logout, child, setChild }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
