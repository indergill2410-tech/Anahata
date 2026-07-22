import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface User { id: string; email: string; name?: string; verified: boolean; }

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<unknown>;
  register: (name: string, email: string, password: string) => Promise<unknown>;
  refreshUser: () => Promise<User | null>;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function isTokenValid(token: string) {
  const payload = parseJwt(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 > Date.now();
}

function normalizeUser(user: Partial<User> | null | undefined): User | null {
  if (!user?.id || !user.email) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name || '',
    verified: user.verified === true,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuth] = useState(false);

  const applyToken = useCallback((nextToken: string) => {
    const payload = parseJwt(nextToken);
    if (!payload) throw new Error('Invalid session token');

    localStorage.setItem('anahata_token', nextToken);
    setToken(nextToken);
    setUser({ id: payload.userId, email: payload.email, name: payload.name, verified: payload.verified === true });
    setIsAuth(true);
  }, []);

  const applyAuthPayload = useCallback((data: { token?: string; user?: Partial<User> }) => {
    if (data.token) {
      applyToken(data.token);
      return normalizeUser(data.user);
    }
    const nextUser = normalizeUser(data.user);
    if (nextUser) {
      setUser(nextUser);
      setIsAuth(true);
    }
    return nextUser;
  }, [applyToken]);

  const logout = useCallback(() => {
    localStorage.removeItem('anahata_token');
    localStorage.removeItem('anahata_onboarded');
    setToken(null);
    setUser(null);
    setIsAuth(false);
  }, []);

  // Rehydrate from localStorage on mount.
  useEffect(() => {
    const stored = localStorage.getItem('anahata_token');
    if (stored && isTokenValid(stored)) {
      try { applyToken(stored); }
      catch { localStorage.removeItem('anahata_token'); }
    } else {
      localStorage.removeItem('anahata_token');
    }
    setLoading(false);
  }, [applyToken]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    applyToken(data.token);
    return data;
  }, [applyToken]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    applyToken(data.token);
    return data;
  }, [applyToken]);

  const refreshUser = useCallback(async () => {
    if (!token) return null;
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      logout();
      return null;
    }
    if (!res.ok) throw new Error(data.error || 'Session refresh failed');
    return applyAuthPayload(data) || normalizeUser(data.user);
  }, [applyAuthPayload, logout, token]);

  // Auto-logout when token expires.
  useEffect(() => {
    if (!token) return;
    const payload = parseJwt(token);
    if (!payload?.exp) return;
    const ms = payload.exp * 1000 - Date.now() - 5000;
    if (ms <= 0) { logout(); return; }
    const t = setTimeout(logout, ms);
    return () => clearTimeout(t);
  }, [token, logout]);

  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const res = await fetch(url, { ...options, headers });
    if (res.status === 401 && token) logout();
    return res;
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      loading,
      login,
      register,
      refreshUser,
      logout,
      authFetch,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
