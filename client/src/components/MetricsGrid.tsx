import React from 'react';

interface MetricsGridProps {
  targetHR?: number;
  tempo?: number;
  binauralHz?: number;
  brainwaveState?: string;
}

export default function MetricsGrid({ targetHR, tempo, binauralHz, brainwaveState }: MetricsGridProps) {
  const tiles = [
    { label: 'Target HR',  value: targetHR    ?? '–', unit: 'BPM' },
    { label: 'Tempo',      value: tempo       ?? '–', unit: 'BPM' },
    { label: 'Binaural',   value: binauralHz  ?? '–', unit: 'Hz'  },
    { label: 'Brainwave',  value: brainwaveState ?? '–', unit: '' },
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
