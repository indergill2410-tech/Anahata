import React from 'react';

export default function NotFoundPage({ onHome }: { onHome: () => void }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-0)', color: 'var(--t1)', textAlign: 'center', padding: 24
    }}>
      <p style={{ fontSize: 56, marginBottom: 8 }}>🪷</p>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Page Not Found</h1>
      <p style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 28 }}>This path doesn't exist in the app.</p>
      <button className="btn btn-primary" onClick={onHome}>Return Home</button>
    </div>
  );
}
