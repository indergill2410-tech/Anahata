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

function userMessage(message: string) {
  const text = message.trim();
  const lower = text.toLowerCase();
  if (!text) return 'Something needs attention.';
  if (lower.includes('requested resource') || lower.includes('not found')) return 'We could not find that item. Please try again.';
  if (lower.includes('server unavailable') || lower.includes('failed to fetch')) return 'Anahata is having trouble connecting. Please try again.';
  if (lower.includes('request failed') || lower.includes('invalid data')) return 'Something did not save cleanly. Please try again.';
  return text;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast['type'] = 'info', duration = 3500) => {
    const id = ++_id;
    setToasts(t => [...t, { id, message: userMessage(message), type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);

  const success = useCallback((m: string, d?: number) => toast(m, 'success', d), [toast]);
  const error   = useCallback((m: string, d?: number) => toast(m, 'error', d),   [toast]);
  const info    = useCallback((m: string, d?: number) => toast(m, 'info', d),    [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="false">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast toast-${t.type}`}
            role={t.type === 'error' ? 'alert' : 'status'}
          >
            <span className="toast-dot" aria-hidden="true" />
            <span className="toast-message">{t.message}</span>
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
