import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('anahata_token'));
  const [loading, setLoading] = useState(true);

  // Validate token on mount
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    // Decode JWT payload (no verify — server handles that)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) { logout(); return; }
      setUser({ id: payload.userId, email: payload.email, name: payload.name || payload.email?.split('@')[0] });
    } catch { logout(); }
    setLoading(false);
  }, []);

  const login = useCallback((tokenStr, userData) => {
    localStorage.setItem('anahata_token', tokenStr);
    setToken(tokenStr);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('anahata_token');
    localStorage.removeItem('anahata_onboarded');
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
