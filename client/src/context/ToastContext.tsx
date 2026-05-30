import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  toast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
  success: (m: string, d?: number) => void;
  error: (m: string, d?: number) => void;
  info: (m: string, d?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let _id = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast['type'] = 'info', duration = 3500) => {
    const id = ++_id;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);

  const success = useCallback((m: string, d?: number) => toast(m, 'success', d), [toast]);
  const error   = useCallback((m: string, d?: number) => toast(m, 'error', d),   [toast]);
  const info    = useCallback((m: string, d?: number) => toast(m, 'info', d),    [toast]);

  const COLOURS = { success: '#34d399', error: '#f87171', info: '#818cf8' };

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      <div style={{
        position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8,
        pointerEvents: 'none', maxWidth: 360, width: '100%', padding: '0 16px'
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: 'rgba(18,18,32,0.97)',
            border: `1px solid ${COLOURS[t.type]}40`,
            borderLeft: `3px solid ${COLOURS[t.type]}`,
            borderRadius: 10,
            padding: '11px 14px',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--t1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            animation: 'slideDown 0.25s cubic-bezier(0.16,1,0.3,1)',
            fontFamily: 'inherit'
          }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
