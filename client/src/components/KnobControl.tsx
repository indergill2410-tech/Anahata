import React, { useRef, useCallback } from 'react';

// Rotary knob — drag vertically to change value
export default function KnobControl({ value = 0.5, min = 0, max = 1, size = 36, color = 'var(--accent)', label, onChange }) {
  const startY  = useRef(null);
  const startVal = useRef(null);

  const toAngle = (v) => {
    const pct = (v - min) / (max - min);
    return -135 + pct * 270; // -135° to +135°
  };

  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    startY.current   = e.clientY;
    startVal.current = value;
    const onMove = (me) => {
      const dy    = startY.current - me.clientY;
      const range = max - min;
      const delta = (dy / 120) * range;
      const next  = Math.max(min, Math.min(max, startVal.current + delta));
      onChange?.(next);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [value, min, max, onChange]);

  const angle = toAngle(value);
  const r = size / 2;
  const cx = r, cy = r;
  const trackR = r - 4;

  // Arc path helper
  const polarToXY = (ang, radius) => {
    const rad = (ang - 90) * (Math.PI / 180);
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const startAng = -135;
  const endAng   = angle;
  const large    = endAng - startAng > 180 ? 1 : 0;
  const sp = polarToXY(startAng, trackR);
  const ep = polarToXY(endAng,   trackR);
  const tp = polarToXY(endAng,   trackR - 3);

  return (
    <div className="knob-wrap" style={{ width: size, height: size + (label ? 18 : 0), display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} onPointerDown={onPointerDown} style={{ touchAction: 'none' }}>
        {/* Track background */}
        <circle cx={cx} cy={cy} r={trackR} fill="none" stroke="var(--bg-2)" strokeWidth="3" strokeDasharray={`${2*Math.PI*trackR*0.75} ${2*Math.PI*trackR}`} strokeDashoffset={`${2*Math.PI*trackR*0.125}`} strokeLinecap="round" transform={`rotate(-135 ${cx} ${cy})`} />
        {/* Value arc */}
        {endAng > startAng && (
          <path
            d={`M ${sp.x} ${sp.y} A ${trackR} ${trackR} 0 ${large} 1 ${ep.x} ${ep.y}`}
            fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
          />
        )}
        {/* Indicator dot */}
        <circle cx={tp.x} cy={tp.y} r="2.5" fill={color} />
        {/* Center */}
        <circle cx={cx} cy={cy} r={r - 8} fill="var(--bg-1)" stroke="var(--border)" strokeWidth="1" />
      </svg>
      {label && <span style={{ fontSize: 8, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{label}</span>}
    </div>
  );
}
