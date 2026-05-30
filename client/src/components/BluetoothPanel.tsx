import React from 'react';

export default function BluetoothPanel({ bleStatus, deviceName, error, onConnect, onDisconnect, isDemo, onToggleDemo }) {
  const isConnected = bleStatus === 'connected';
  const isSearching = bleStatus === 'searching';

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-label">Smartwatch</span>
        <span className={`pill ${bleStatus}`}>
          <span className="pill-dot" />
          {isConnected ? (deviceName || 'Connected') : isSearching ? 'Searching…' : 'Disconnected'}
        </span>
      </div>

      {error && <p style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8 }}>
        {!isConnected ? (
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={onConnect} disabled={isSearching}>
            {isSearching ? <><span className="spinner" /> Searching…</> : '⊕ Connect via Bluetooth'}
          </button>
        ) : (
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onDisconnect}>Disconnect</button>
        )}

        <button
          className={`btn ${isDemo ? 'btn-ghost' : 'btn-ghost'}`}
          style={{ flex: 1, color: isDemo ? 'var(--amber)' : 'var(--t2)', borderColor: isDemo ? 'rgba(245,158,11,0.3)' : undefined }}
          onClick={onToggleDemo}
          disabled={isConnected}
        >
          {isDemo ? 'Stop demo' : 'Demo mode'}
        </button>
      </div>
    </div>
  );
}
