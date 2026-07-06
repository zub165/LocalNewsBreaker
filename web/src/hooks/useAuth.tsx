import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { api } from '../api/client';
import { hybridStore } from '../storage/hybridStore';
import type { User } from '../types/story';

interface AuthContextValue {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => hybridStore.getUser());

  const refreshUser = useCallback(async () => {
    if (!hybridStore.getToken()) {
      setUser(null);
      return;
    }
    try {
      const me = await api.me();
      setUser(me);
      hybridStore.setSession(hybridStore.getToken()!, me);
    } catch {
      hybridStore.clearSession();
      setUser(null);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const session = await api.login(username, password);
    setUser(session.user);
  }, []);

  const register = useCallback(async (username: string, password: string, email?: string) => {
    const session = await api.register(username, password, email);
    setUser(session.user);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    await api.deleteAccount();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, login, register, logout, refreshUser, deleteAccount }),
    [user, login, register, logout, refreshUser, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
