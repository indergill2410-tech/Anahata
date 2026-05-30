import React, { CSSProperties } from 'react';

interface SkeletonLineProps { width?: string | number; height?: number; style?: CSSProperties; }

export function SkeletonLine({ width = '100%', height = 12, style = {} }: SkeletonLineProps) {
  return (
    <div style={{
      width, height, borderRadius: 6,
      background: 'linear-gradient(90deg, var(--bg-2) 25%, var(--bg-3) 50%, var(--bg-2) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
      ...style
    }} />
  );
}

export function SkeletonTrackCard() {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }}>
      <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
        animation: 'shimmer 1.4s infinite',
        background: 'linear-gradient(90deg, var(--bg-2) 25%, var(--bg-3) 50%, var(--bg-2) 75%)',
        backgroundSize: '200% 100%'
      }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SkeletonLine width="70%" height={12} />
        <SkeletonLine width="45%" height={10} />
      </div>
    </div>
  );
}

export function SkeletonMetricTile() {
  return (
    <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <SkeletonLine width="40%" height={10} />
      <SkeletonLine width="60%" height={20} />
    </div>
  );
}
