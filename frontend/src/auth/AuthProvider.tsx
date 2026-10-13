import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api, setAccessToken } from '../services/api';
import type { AuthUser } from '../types/api';

type Credentials = { email: string; password: string };
type Registration = Credentials & { displayName: string };
type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (credentials: Credentials) => Promise<void>;
  register: (details: Registration) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const expireSession = () => {
      setAccessToken(null);
      if (mounted) setUser(null);
    };
    window.addEventListener('bhumi:session-expired', expireSession);
    void api.refreshSession()
      .then(session => {
        if (!mounted) return;
        setAccessToken(session.access_token);
        setUser(session.user);
      })
      .catch(() => {
        setAccessToken(null);
        if (mounted) setUser(null);
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => {
      mounted = false;
      window.removeEventListener('bhumi:session-expired', expireSession);
    };
  }, []);

  async function login(credentials: Credentials) {
    const session = await api.login(credentials.email, credentials.password);
    setAccessToken(session.access_token);
    setUser(session.user);
  }

  async function register(details: Registration) {
    const session = await api.register(details.displayName, details.email, details.password);
    setAccessToken(session.access_token);
    setUser(session.user);
  }

  async function logout() {
    await api.logout();
    setAccessToken(null);
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}