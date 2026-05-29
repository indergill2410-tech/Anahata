import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState('login'); // login | register
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  function validate() {
    const e = {};
    if (mode === 'register' && !form.name.trim()) e.name = 'Name is required';
    if (!form.email.includes('@')) e.email = 'Valid email required';
    if (form.password.length < 6) e.password = 'Min 6 characters';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setServerError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { setServerError(data.error || 'Something went wrong'); return; }
      login(data.token, data.user);
    } catch { setServerError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="auth-page fade-in">
      <div className="auth-logo">Ana<span>hata</span></div>
      <p className="auth-tagline">Your heart leads. The music follows.</p>

      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <div>
          <h2 className="auth-title">{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
          <p className="auth-sub">{mode === 'login' ? 'Sign in to your account' : 'Start your meditation journey'}</p>
        </div>

        {mode === 'register' && (
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input className={`form-input${errors.name ? ' error' : ''}`} type="text"
              placeholder="Your name" value={form.name} onChange={set('name')} autoComplete="name" />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email</label>
          <input className={`form-input${errors.email ? ' error' : ''}`} type="email"
            placeholder="you@example.com" value={form.email} onChange={set('email')} autoComplete="email" />
          {errors.email && <span className="form-error">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input className={`form-input${errors.password ? ' error' : ''}`} type="password"
            placeholder="••••••••" value={form.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          {errors.password && <span className="form-error">{errors.password}</span>}
        </div>

        {serverError && <p className="form-error" style={{ textAlign: 'center' }}>{serverError}</p>}

        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading ? <span className="spinner" /> : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <div className="divider">or</div>

        <p className="auth-switch">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors({}); setServerError(''); }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </form>
    </div>
  );
}
