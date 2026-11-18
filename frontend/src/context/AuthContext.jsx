import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setUnauthorizedHandler } from '../api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  const logout = useCallback(() => { localStorage.removeItem('token'); setUser(null); }, []);
  useEffect(() => { setUnauthorizedHandler(logout); }, [logout]);

  useEffect(() => {
    if (!getToken()) return;
    api.me().then((r) => setUser(r.user)).catch(logout).finally(() => setLoading(false));
  }, [logout]);

  const finish = (r) => { localStorage.setItem('token', r.token); setUser(r.user); return r.user; };
  const login = async (body) => finish(await api.login(body));
  const register = async (body) => finish(await api.register(body));

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
}
