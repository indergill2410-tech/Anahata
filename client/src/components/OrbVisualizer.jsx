import React, { useEffect, useRef } from 'react';

const BW_PALETTE = {
  Delta:   { core: '#1a0550', mid: '#4c1e96', outer: '#6d4aff', particle: '#8b6fff' },
  Theta:   { core: '#1a0535', mid: '#7c1faa', outer: '#a855f7', particle: '#c084fc' },
  Alpha:   { core: '#0a2a1a', mid: '#0a7a45', outer: '#22c55e', particle: '#86efac' },
  Beta:    { core: '#0a1f35', mid: '#0a5fa0', outer: '#3b82f6', particle: '#93c5fd' },
  Gamma:   { core: '#1a1505', mid: '#7a6400', outer: '#eab308', particle: '#fde047' },
  default: { core: '#0e0e20', mid: '#2d1f6e', outer: '#6d4aff', particle: '#8b6fff' },
};

function initParticles(count, cx, cy, maxR) {
  return Array.from({ length: count }, (_, i) => ({
    angle:  (i / count) * Math.PI * 2,
    radius: maxR * (0.55 + Math.random() * 0.45),
    speed:  (0.0003 + Math.random() * 0.0006) * (Math.random() < 0.5 ? 1 : -1),
    size:   1 + Math.random() * 2.5,
    opacity: 0.3 + Math.random() * 0.6,
    drift:  Math.random() * Math.PI * 2,
  }));
}

export default function OrbVisualizer({ brainwave = 'Theta', isPlaying = false, heartRate = null, binauralHz = 7, size = 280 }) {
  const canvasRef  = useRef(null);
  const frameRef   = useRef(null);
  const stateRef   = useRef({ t: 0, particles: null, brainwave, isPlaying, heartRate, binauralHz });

  useEffect(() => {
    stateRef.current = { ...stateRef.current, brainwave, isPlaying, heartRate, binauralHz };
  }, [brainwave, isPlaying, heartRate, binauralHz]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width  = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const cx = size / 2, cy = size / 2;
    const baseR = size * 0.28;
    stateRef.current.particles = initParticles(48, cx, cy, size * 0.46);

    function draw(timestamp) {
      const s = stateRef.current;
      s.t = timestamp / 1000;
      const pal = BW_PALETTE[s.brainwave] || BW_PALETTE.default;

      // Breathing: cap visual frequency at 0.4Hz so it's always visible
      const breathFreq = Math.min(s.binauralHz, 0.5);
      const breathAmp  = s.isPlaying ? 0.07 : 0.02;
      const breathScale = 1 + breathAmp * Math.sin(2 * Math.PI * breathFreq * s.t);
      const r = baseR * breathScale;

      ctx.clearRect(0, 0, size, size);

      // ── Outer glow rings ──────────────────────────────────────────────
      for (let i = 3; i >= 1; i--) {
        const ringR = r * (1 + i * 0.22);
        const alpha = s.isPlaying ? (0.06 / i) * breathScale : 0.02 / i;
        const grad = ctx.createRadialGradient(cx, cy, ringR * 0.85, cx, cy, ringR);
        grad.addColorStop(0, `${pal.outer}${Math.round(alpha * 255).toString(16).padStart(2,'0')}`);
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // ── Core orb ──────────────────────────────────────────────────────
      const orbGrad = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, 0, cx, cy, r * 1.1);
      orbGrad.addColorStop(0,   `${pal.mid}ff`);
      orbGrad.addColorStop(0.4, `${pal.core}ee`);
      orbGrad.addColorStop(0.8, `${pal.core}99`);
      orbGrad.addColorStop(1,   `${pal.core}00`);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = orbGrad;
      ctx.fill();

      // ── Inner shimmer ─────────────────────────────────────────────────
      if (s.isPlaying) {
        const shimmer = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r * 0.6);
        const shimAlpha = (0.12 + 0.08 * Math.sin(s.t * 2.5)).toString(16).padStart(2,'0').slice(0,2);
        shimmer.addColorStop(0, `${pal.outer}${shimAlpha}`);
        shimmer.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = shimmer;
        ctx.fill();
      }

      // ── Particles ─────────────────────────────────────────────────────
      (s.particles || []).forEach(p => {
        p.angle += p.speed * (s.isPlaying ? 1.4 : 0.3);
        const drift = Math.sin(s.t * 0.4 + p.drift) * (size * 0.025);
        const pr = p.radius + drift;
        const px = cx + pr * Math.cos(p.angle);
        const py = cy + pr * Math.sin(p.angle);
        const alpha = s.isPlaying ? p.opacity : p.opacity * 0.3;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${pal.particle}${Math.round(alpha * 255).toString(16).padStart(2,'0')}`;
        ctx.fill();
      });

      // ── Heart rate text ───────────────────────────────────────────────
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (s.heartRate) {
        ctx.font = `300 ${Math.round(r * 0.6)}px Inter, system-ui`;
        ctx.fillStyle = '#f0eeff';
        ctx.fillText(s.heartRate, cx, cy - r * 0.06);
        ctx.font = `600 ${Math.round(r * 0.18)}px Inter, system-ui`;
        ctx.fillStyle = 'rgba(240,238,255,0.5)';
        ctx.fillText('BPM', cx, cy + r * 0.38);
      } else {
        ctx.font = `300 ${Math.round(r * 0.28)}px Inter, system-ui`;
        ctx.fillStyle = s.isPlaying ? 'rgba(240,238,255,0.7)' : 'rgba(240,238,255,0.25)';
        ctx.fillText(s.isPlaying ? s.brainwave : '✦', cx, cy);
      }

      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', cursor: 'pointer', borderRadius: '50%' }}
    />
  );
}
