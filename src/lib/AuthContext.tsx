'use client';

import {
  createContext, useContext, useEffect, useState,
  useCallback, type ReactNode,
} from 'react';
import { tokenStorage, bearerHeader } from './auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

export type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login:    (email: string, password: string) => Promise<string | null>;
  register: (data: RegisterData) => Promise<string | null>;
  logout:   () => Promise<void>;
};

export type RegisterData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

const AuthContext = createContext<AuthCtx | null>(null);

async function fetchMe(accessToken: string): Promise<User | null> {
  try {
    const res = await fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function tryRefresh(): Promise<string | null> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) return null;
  try {
    const res = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${refresh}` },
    });
    if (!res.ok) return null;
    const { accessToken, refreshToken } = await res.json();
    tokenStorage.set(accessToken, refreshToken);
    return accessToken;
  } catch { return null; }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let access = tokenStorage.getAccess();
      if (!access) { setLoading(false); return; }

      let u = await fetchMe(access);
      if (!u) {
        // access token expired — try refresh
        access = await tryRefresh();
        if (access) u = await fetchMe(access);
      }
      setUser(u);
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return Array.isArray(err.message) ? err.message[0] : (err.message ?? 'Identifiants incorrects.');
    }
    const { accessToken, refreshToken, user } = await res.json();
    tokenStorage.set(accessToken, refreshToken);
    // backend returns user directly — no extra /auth/me call needed
    setUser(user ?? await fetchMe(accessToken));
    return null;
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<string | null> => {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return Array.isArray(err.message) ? err.message[0] : (err.message ?? 'Une erreur est survenue.');
    }
    const { accessToken, refreshToken, user } = await res.json();
    tokenStorage.set(accessToken, refreshToken);
    setUser(user ?? await fetchMe(accessToken));
    return null;
  }, []);

  const logout = useCallback(async () => {
    const access = tokenStorage.getAccess();
    if (access) {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        headers: bearerHeader(),
      }).catch(() => {});
    }
    tokenStorage.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
