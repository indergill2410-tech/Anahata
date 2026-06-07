import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface AuthPageProps { onBack?: () => void; }

type AuthMode = 'login' | 'register';
type FormErrors = Record<string, string>;
type FormState = { name: string; email: string; password: string };

export default function AuthPage({ onBack }: AuthPageProps) {
  const { login, register } = useAuth();
  const { success, error } = useToast();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<FormState>({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});

  const isRegister = mode === 'register';

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
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
          {label}
        </span>
        <div style={{ position: 'relative' }}>
          <input
            className={errors[key] ? 'input-error' : ''}
            type={inputType}
            autoComplete={autoComplete}
            value={form[key]}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            style={{
              height: 46,
              borderRadius: 14,
              paddingRight: isPassword ? 82 : 16,
              background: '#FFFFFF',
              borderColor: errors[key] ? 'rgba(230,73,128,0.55)' : 'var(--border)',
            }}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{
                position: 'absolute', right: 8, top: 7,
                height: 32, padding: '0 12px', borderRadius: 10,
                border: '1px solid var(--border)', background: 'var(--bg2)',
                color: 'var(--ink2)', fontSize: 11, fontWeight: 700,
              }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          )}
        </div>
        {errors[key] && <span style={{ fontSize: 11, color: 'var(--rose)' }}>{errors[key]}</span>}
      </label>
    );
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 18%, rgba(112,72,232,0.10), transparent 34%), var(--bg)',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {onBack && (
          <button onClick={onBack} style={{
            background: 'none', border: 'none', color: 'var(--ink3)', cursor: 'pointer',
            fontSize: 13, marginBottom: 18, padding: 0, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span aria-hidden="true">←</span> Continue without signing in
          </button>
        )}

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 58, height: 58, borderRadius: '50%', margin: '0 auto 14px',
            background: 'radial-gradient(circle at 35% 30%, #C4B5FD, #7048E8 58%, #3B5BDB)',
            boxShadow: '0 12px 34px rgba(112,72,232,0.34)',
          }} />
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink1)', margin: 0,
          }}>
            {isRegister ? 'Create your space' : 'Return to Anahata'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ink3)', margin: '8px auto 0', lineHeight: 1.65, maxWidth: 300 }}>
            Save your practice, journal, favourite tracks, and personal sound settings privately.
          </p>
        </div>

        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, borderRadius: 20 }}>
          <div style={{ display: 'flex', background: 'var(--bg2)', borderRadius: 14, padding: 4, gap: 4 }}>
            {(['login', 'register'] as AuthMode[]).map(m => (
              <button key={m} type="button" onClick={() => { setMode(m); setErrors({}); }} style={{
                flex: 1, height: 38, borderRadius: 11, border: 'none',
                background: mode === m ? '#FFFFFF' : 'transparent',
                color: mode === m ? 'var(--ink1)' : 'var(--ink3)',
                boxShadow: mode === m ? '0 2px 10px rgba(23,18,10,0.08)' : 'none',
                fontSize: 13, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer',
                transition: 'all var(--dur) var(--ease)',
              }}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {isRegister && field('name', 'text', 'Full name', 'name')}
            {field('email', 'email', 'Email address', 'email')}
            {field('password', 'password', 'Password', isRegister ? 'new-password' : 'current-password')}

            <button type="submit" className="btn-primary" disabled={loading}
              style={{ height: 48, fontSize: 14, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : (isRegister ? 'Create Account' : 'Sign In')}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink3)', marginTop: 18, lineHeight: 1.6 }}>
          Your journal is private to your account. Guest entries stay on this device until synced.
        </p>
      </div>
    </div>
  );
}
