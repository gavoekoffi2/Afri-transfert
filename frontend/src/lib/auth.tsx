'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, tokenStore, unwrap } from './api';
import { AuthResponse, User } from './types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterInput {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
  countryIso2?: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    if (!tokenStore.access) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await unwrap<User>(api.get('/users/me'));
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email: string, password: string) {
    const res = await unwrap<AuthResponse>(api.post('/auth/login', { email, password }));
    tokenStore.set(res.tokens.accessToken, res.tokens.refreshToken);
    setUser(res.user);
  }

  async function register(input: RegisterInput) {
    const res = await unwrap<AuthResponse>(api.post('/auth/register', input));
    tokenStore.set(res.tokens.accessToken, res.tokens.refreshToken);
    setUser(res.user);
  }

  function logout() {
    void api.post('/auth/logout').catch(() => undefined);
    tokenStore.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return ctx;
}
