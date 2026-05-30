import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AuthPage({ onBack }) {
  const { login, register } = useAuth();
  const { success, error }  = useToast();
  const [mode, setMode]     = useState('login');   // login | register
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (mode === 'register' && !form.name.trim()) e.name = 'Name is required';
    if (!form.email.match(/^[^@]+@[^@]+\.[^@]+$/))  e.email = 'Valid email required';
    if (form.password.length < 8)                    e.password = 'Min 8 characters';
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        success('Welcome back 🪷');
      } else {
        await register(form.name, form.email, form.password);
        success('Account created 🎉');
      }
    } catch (err) {
      error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function field(key, type, placeholder, autoComplete) {
    return (
      <div>
        <input
          className={`form-input${errors[key] ? ' input-error' : ''}`}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        />
        {errors[key] && <p style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>{errors[key]}</p>}
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-0)', padding: 24
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        {onBack && (
          <button onClick={onBack} style={{
            background:'none', border:'none', color:'var(--t3)', cursor:'pointer',
            fontSize:13, marginBottom:16, padding:0, display:'flex', alignItems:'center', gap:4
          }}>← Continue without signing in</button>
        )}
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🪷</div>
          <h1 style={{ fontSize: 26, fontWeight: 300, letterSpacing: '-0.02em', color: 'var(--t1)' }}>
            Ana<span style={{ color: 'var(--accent-hi)', fontWeight: 500 }}>hata</span>
          </h1>
          <p style={{ fontSize: 13, color: 'var(--t3)', marginTop: 6 }}>Biometric meditation</p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Mode Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-2)', borderRadius: 8, padding: 3 }}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setErrors({}); }} style={{
                flex: 1, height: 32, borderRadius: 6, border: 'none',
                background: mode === m ? 'var(--bg-3)' : 'transparent',
                color: mode === m ? 'var(--t1)' : 'var(--t3)',
                fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
                transition: 'all var(--dur) var(--ease)', textTransform: 'capitalize'
              }}>{m === 'login' ? 'Sign In' : 'Create Account'}</button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mode === 'register' && field('name', 'text', 'Full name', 'name')}
            {field('email', 'email', 'Email address', 'email')}
            {field('password', 'password', 'Password (min 8 chars)', 'current-password')}

            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ height: 44, fontSize: 14, marginTop: 4 }}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--t3)', marginTop: 20, lineHeight: 1.6 }}>
          By continuing you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}
