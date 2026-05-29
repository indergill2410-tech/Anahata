import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function isTokenValid(token) {
  const payload = parseJwt(token);
  if (!payload) return false;
  return payload.exp * 1000 > Date.now();
}

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [token, setToken]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [isAuthenticated, setIsAuth]  = useState(false);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('anahata_token');
    if (stored && isTokenValid(stored)) {
      const payload = parseJwt(stored);
      setToken(stored);
      setUser({ id: payload.userId, email: payload.email, name: payload.name });
      setIsAuth(true);
    } else {
      localStorage.removeItem('anahata_token');
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('anahata_token', data.token);
    const payload = parseJwt(data.token);
    setToken(data.token);
    setUser({ id: payload.userId, email: payload.email, name: payload.name });
    setIsAuth(true);
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    localStorage.setItem('anahata_token', data.token);
    const payload = parseJwt(data.token);
    setToken(data.token);
    setUser({ id: payload.userId, email: payload.email, name: payload.name });
    setIsAuth(true);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('anahata_token');
    localStorage.removeItem('anahata_onboarded');
    setToken(null);
    setUser(null);
    setIsAuth(false);
  }, []);

  // Auto-logout when token expires
  useEffect(() => {
    if (!token) return;
    const payload = parseJwt(token);
    if (!payload) return;
    const ms = payload.exp * 1000 - Date.now() - 5000;
    if (ms <= 0) { logout(); return; }
    const t = setTimeout(logout, ms);
    return () => clearTimeout(t);
  }, [token, logout]);

  const authFetch = useCallback(async (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, loading, login, register, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
