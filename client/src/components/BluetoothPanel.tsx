import React from 'react';

interface BluetoothPanelProps {
  bleStatus: string;
  deviceName?: string;
  error?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  isPractice?: boolean;
  onTogglePractice: () => void;
}

export default function BluetoothPanel({ bleStatus, deviceName, error, onConnect, onDisconnect, isPractice, onTogglePractice }: BluetoothPanelProps) {
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
            {isSearching ? <><span className="spinner" /> Looking nearby...</> : 'Connect watch'}
          </button>
        ) : (
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onDisconnect}>Disconnect</button>
        )}

        <button
          className="btn btn-ghost"
          style={{ flex: 1, color: isPractice ? 'var(--amber)' : 'var(--t2)', borderColor: isPractice ? 'rgba(245,158,11,0.3)' : undefined }}
          onClick={onTogglePractice}
          disabled={isConnected}
        >
          {isPractice ? 'Stop practice' : 'Practice mode'}
        </button>
      </div>
    </div>
  );
}
