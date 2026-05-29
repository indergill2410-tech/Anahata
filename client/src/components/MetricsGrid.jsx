import React from 'react';

export default function MetricsGrid({ params }) {
  const tiles = [
    { label: 'Target HR',   value: `${params.targetHeartRate}`, unit: 'BPM' },
    { label: 'Tempo',       value: `${params.musicalTempo}`,    unit: 'BPM' },
    { label: 'Binaural',    value: `${params.binauralHz}`,      unit: 'Hz'  },
    { label: 'Brainwave',   value: params.desiredBrainwaveState, unit: ''   },
  ];

  return (
    <div className="metrics-grid">
      {tiles.map(t => (
        <div className="metric-tile" key={t.label}>
          <span className="metric-tile-label">{t.label}</span>
          <span className="metric-tile-value">{t.value}</span>
          {t.unit && <span className="metric-tile-sub">{t.unit}</span>}
        </div>
      ))}
    </div>
  );
}
