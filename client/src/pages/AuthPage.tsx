import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface AuthPageProps { onBack?: () => void; }

type AuthMode = 'login' | 'register';
type FormErrors = Record<string, string>;
type FormState = { name: string; email: string; password: string };

function tone(color: string, alpha = '18') {
  return `${color}${alpha}`;
}

function SectionLabel({ children, color = 'var(--ink3)' }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 0, textTransform: 'uppercase', color, fontFamily: "'Space Grotesk', sans-serif" }}>
      {children}
    </span>
  );
}

function AuthOrb({ mode }: { mode: AuthMode }) {
  const color = mode === 'register' ? '#7048E8' : '#3B5BDB';
  return (
    <div style={{ width: 86, height: 86, position: 'relative', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
      <span style={{ position: 'absolute', inset: -12, borderRadius: '50%', border: `1px solid ${tone(color, '24')}` }} />
      <span style={{ position: 'absolute', inset: -2, borderRadius: '50%', border: `1.5px solid ${tone(color, '3A')}`, boxShadow: `0 0 30px ${tone(color, '28')}` }} />
      <div style={{
        width: 86,
        height: 86,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background: `radial-gradient(circle at 35% 28%, #FFFFFF, ${color} 50%, ${tone(color, '91')} 78%)`,
        color: '#FFFFFF',
        boxShadow: `inset 0 2px 12px rgba(255,255,255,0.4), 0 16px 38px ${tone(color, '34')}`,
      }}>
        <svg aria-hidden="true" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {mode === 'register' ? (
            <>
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M19 8v6" />
              <path d="M22 11h-6" />
            </>
          ) : (
            <>
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

function PromiseTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ borderRadius: 18, padding: '12px 11px', background: '#FFFFFF', border: `1px solid ${tone(color, '20')}`, minWidth: 0 }}>
      <div style={{ fontSize: 10, color: 'var(--ink3)', fontWeight: 900, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ marginTop: 4, color, fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
    </div>
  );
}

export default function AuthPage({ onBack }: AuthPageProps) {
  const { login, register } = useAuth();
  const { success, error } = useToast();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<FormState>({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});

  const isRegister = mode === 'register';
  const accent = isRegister ? '#7048E8' : '#3B5BDB';

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (isRegister && !form.name.trim()) e.name = 'Name is required';
    if (!form.email.match(/^[^@]+@[^@]+\.[^@]+$/)) e.email = 'Enter a valid email';
    if (form.password.length < 8) e.password = 'Use at least 8 characters';
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setErrors({});
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        success('Welcome back');
      } else {
        await register(form.name, form.email, form.password);
        success('Account created');
      }
    } catch (err: unknown) {
      error((err as Error).message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function field(key: keyof FormState, type: string, label: string, autoComplete: string) {
    const isPassword = key === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    return (
      <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <SectionLabel>{label}</SectionLabel>
        <div style={{ position: 'relative' }}>
          <input
            className={errors[key] ? 'input-error' : ''}
            type={inputType}
            autoComplete={autoComplete}
            value={form[key]}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            style={{
              height: 48,
              borderRadius: 18,
              paddingRight: isPassword ? 58 : 16,
              background: '#FFFFFF',
              borderColor: errors[key] ? 'rgba(230,73,128,0.55)' : 'var(--border)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.75)',
            }}
          />
          {isPassword && (
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword(v => !v)}
              style={{
                position: 'absolute', right: 8, top: 7,
                width: 34, height: 34, borderRadius: '50%',
                border: '1px solid var(--border)', background: 'var(--bg2)',
                color: 'var(--ink2)', display: 'grid', placeItems: 'center',
              }}
            >
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {showPassword ? (
                  <>
                    <path d="M17.94 17.94A10.9 10.9 0 0 1 12 20C7 20 2.73 16.89 1 12c.8-2.28 2.27-4.21 4.12-5.58" />
                    <path d="M9.9 4.24A10.7 10.7 0 0 1 12 4c5 0 9.27 3.11 11 8a11.8 11.8 0 0 1-2.1 3.45" />
                    <path d="M14.12 14.12a3 3 0 0 1-4.24-4.24" />
                    <path d="M1 1l22 22" />
                  </>
                ) : (
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
            </button>
          )}
        </div>
        {errors[key] && <span style={{ fontSize: 11, color: 'var(--rose)' }}>{errors[key]}</span>}
      </label>
    );
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: `
        radial-gradient(ellipse at 50% 0%, ${tone(accent, '80')}, transparent 44%),
        radial-gradient(ellipse at 88% 16%, rgba(59,91,219,0.3), transparent 40%),
        radial-gradient(ellipse at 8% 84%, rgba(12,166,120,0.2), transparent 42%),
        linear-gradient(180deg, #090B1E 0%, #141A33 44%, #2A1742 70%, #F4F0E8 100%)`,
      padding: 22,
    }}>
      <main style={{ width: '100%', maxWidth: 410, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {onBack && (
          <button onClick={onBack} style={{
            alignSelf: 'flex-start',
            border: '1px solid rgba(255,255,255,0.18)',
            color: 'var(--on-dark-1)',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            fontSize: 12,
            padding: '9px 13px',
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            fontWeight: 900,
          }}>
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            Continue without signing in
          </button>
        )}

        <section style={{ position: 'relative', overflow: 'hidden', borderRadius: 30, padding: 20, background: 'linear-gradient(150deg, #1B1630, #0E0B1C)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 22px 60px rgba(7,9,24,0.5), inset 0 1px 0 rgba(255,255,255,0.14)' }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 82% 8%, ${tone(accent, '55')}, transparent 38%), radial-gradient(circle at 5% 90%, rgba(12,166,120,0.22), transparent 32%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
            <AuthOrb mode={mode} />
            <div style={{ minWidth: 0 }}>
              <SectionLabel color="rgba(255,255,255,0.62)">Private account</SectionLabel>
              <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 29, lineHeight: 1.04, fontWeight: 900, letterSpacing: 0, margin: '6px 0 5px', color: '#FFFFFF' }}>
                {isRegister ? 'Create your space' : 'Return to Anahata'}
              </h1>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', lineHeight: 1.55, margin: 0 }}>
                Save journals, dreams, sessions, mixes, and personal settings privately.
              </p>
            </div>
          </div>
        </section>

        <section style={{ borderRadius: 28, padding: 18, background: 'rgba(255,255,255,0.96)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, background: 'var(--bg2)', borderRadius: 18, padding: 4 }}>
            {(['login', 'register'] as AuthMode[]).map(m => (
              <button key={m} type="button" onClick={() => { setMode(m); setErrors({}); }} style={{
                height: 42,
                borderRadius: 15,
                border: 'none',
                background: mode === m ? '#FFFFFF' : 'transparent',
                color: mode === m ? (m === 'register' ? '#7048E8' : '#3B5BDB') : 'var(--ink3)',
                boxShadow: mode === m ? '0 3px 12px rgba(23,18,10,0.08)' : 'none',
                fontSize: 13,
                fontWeight: 900,
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {isRegister && field('name', 'text', 'Full name', 'name')}
            {field('email', 'email', 'Email address', 'email')}
            {field('password', 'password', 'Password', isRegister ? 'new-password' : 'current-password')}

            <button type="submit" className="btn-primary" disabled={loading}
              style={{ height: 50, fontSize: 14, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${accent}, #3B5BDB)`, boxShadow: `0 10px 24px ${tone(accent, '32')}` }}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : (isRegister ? 'Create account' : 'Sign in')}
            </button>
          </form>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <PromiseTile label="Journal" value="Private memory" color="#7048E8" />
          <PromiseTile label="Dashboard" value="Personal signals" color="#0CA678" />
        </section>
      </main>
    </div>
  );
}
