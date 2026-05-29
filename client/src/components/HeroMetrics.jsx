import React from 'react';

export default function HeroMetrics({ heartRate, musicParams, wsStatus }) {
  return (
    <div style={{ paddingTop: 8 }}>
      <div className="hero-section">
        <div className="pulse-container">
          {heartRate && (
            <>
              <div className="pulse-ring-outer" />
              <div className="pulse-ring-mid" />
            </>
          )}
          <div className="pulse-ring-core">
            <span className="bpm-number">{heartRate ?? '–'}</span>
            <span className="bpm-unit">BPM</span>
          </div>
        </div>

        <span className="hero-state">
          {musicParams?.desiredBrainwaveState
            ? `${musicParams.desiredBrainwaveState} state`
            : 'Awaiting heart rate…'}
        </span>
        <span className="hero-sub">
          Server 
          <span style={{ color: wsStatus === 'connected' ? 'var(--green)' : wsStatus === 'connecting' ? 'var(--amber)' : 'var(--red)' }}>
            {wsStatus}
          </span>
        </span>
      </div>
    </div>
  );
}
