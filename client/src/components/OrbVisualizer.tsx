import React, { useRef, useEffect } from 'react';

interface Particle { angle: number; radius: number; speed: number; size: number; phase: number; drift: number; }

const BW_NEON: Record<string, { h: number; s: number; l: number }> = {
  Delta:  { h: 210, s: 100, l: 60 },  // electric blue
  Theta:  { h: 270, s: 100, l: 65 },  // vivid violet
  Alpha:  { h: 160, s: 100, l: 50 },  // neon green
  Beta:   { h: 200, s: 100, l: 55 },  // cyan-blue
  Gamma:  { h: 42,  s: 100, l: 58 },  // gold
};

const PARTICLE_COUNT = 64;

interface OrbVisualizerProps {
  brainwave?: string;
  isPlaying: boolean;
  heartRate?: number;
  binauralHz?: number;
  size?: number;
}

export default function OrbVisualizer({ brainwave = 'Theta', isPlaying, heartRate, binauralHz = 6, size = 280 }: OrbVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number | null>(null);
  const stateRef  = useRef<{ particles: Particle[]; t: number }>({ particles: [], t: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width  = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    stateRef.current.particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      angle:  (i / PARTICLE_COUNT) * Math.PI * 2,
      radius: size * 0.28 + Math.random() * size * 0.18,
      speed:  0.004 + Math.random() * 0.008,
      size:   1.2 + Math.random() * 3,
      phase:  Math.random() * Math.PI * 2,
      drift:  (Math.random() - 0.5) * 0.003,
    }));

    const cx = size / 2, cy = size / 2;
    const baseR = size * 0.24;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      stateRef.current.t += 0.014;
      const t = stateRef.current.t;

      ctx.clearRect(0, 0, size, size);

      const neon = BW_NEON[brainwave] || BW_NEON.Theta;
      const { h, s, l } = neon;

      const beatHz   = Math.max(binauralHz * 0.15, 0.08);
      const breathAmp = isPlaying ? 0.09 : 0.03;
      const scale    = 1 + breathAmp * Math.sin(2 * Math.PI * beatHz * t);
      const orbR     = baseR * scale;

      // Far ambient glow (4 rings, decreasing opacity)
      for (let i = 5; i >= 1; i--) {
        const r = orbR * (1 + i * 0.55);
        const alpha = isPlaying ? (0.18 / i) : (0.06 / i);
        const grd = ctx.createRadialGradient(cx, cy, orbR * 0.4, cx, cy, r);
        grd.addColorStop(0, `hsla(${h},${s}%,${l}%,${alpha * 2})`);
        grd.addColorStop(1, `hsla(${h},${s}%,${l}%,0)`);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      // Sharp neon ring
      if (isPlaying) {
        ctx.beginPath();
        ctx.arc(cx, cy, orbR * 1.02, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${h},${s}%,${l}%,0.5)`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Second pulsing ring
        const ring2R = orbR * (1.18 + 0.06 * Math.sin(t * 2.1));
        ctx.beginPath();
        ctx.arc(cx, cy, ring2R, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${h},${s}%,${l}%,${0.2 + 0.1 * Math.sin(t * 1.5)})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      // Core body — deep dark centre + neon rim
      const bodyGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbR);
      bodyGrd.addColorStop(0, `hsla(${h},30%,8%,1)`);
      bodyGrd.addColorStop(0.45, `hsla(${h},60%,12%,1)`);
      bodyGrd.addColorStop(0.78, `hsla(${h},${s}%,${l * 0.45}%,0.9)`);
      bodyGrd.addColorStop(1,    `hsla(${h},${s}%,${l}%,0.95)`);
      ctx.beginPath();
      ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
      ctx.fillStyle = bodyGrd;
      ctx.fill();

      // Inner energy core glow
      if (isPlaying) {
        const coreR = orbR * (0.28 + 0.06 * Math.sin(t * 3.7));
        const coreGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
        coreGrd.addColorStop(0, `hsla(${h},100%,90%,0.8)`);
        coreGrd.addColorStop(0.5, `hsla(${h},${s}%,${l}%,0.4)`);
        coreGrd.addColorStop(1, `hsla(${h},${s}%,${l}%,0)`);
        ctx.beginPath();
        ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
        ctx.fillStyle = coreGrd;
        ctx.fill();
      }

      // Specular highlight (top-left)
      const hiGrd = ctx.createRadialGradient(
        cx - orbR * 0.32, cy - orbR * 0.38, 0,
        cx - orbR * 0.32, cy - orbR * 0.38, orbR * 0.55
      );
      hiGrd.addColorStop(0, 'rgba(255,255,255,0.22)');
      hiGrd.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
      ctx.fillStyle = hiGrd;
      ctx.fill();

      // Corona particles
      stateRef.current.particles.forEach(p => {
        p.angle += p.speed * (isPlaying ? 1.2 : 0.15) + p.drift;
        const wobble = Math.sin(t * 1.8 + p.phase) * size * 0.03;
        const px     = cx + Math.cos(p.angle) * (p.radius + wobble);
        const py     = cy + Math.sin(p.angle) * (p.radius + wobble);
        const alpha  = isPlaying
          ? (0.55 + 0.45 * Math.sin(t * 2.5 + p.phase))
          : (0.12 + 0.08 * Math.sin(t + p.phase));
        const grd = ctx.createRadialGradient(px, py, 0, px, py, p.size * 2);
        grd.addColorStop(0, `hsla(${h},${s}%,${l + 20}%,${alpha})`);
        grd.addColorStop(1, `hsla(${h},${s}%,${l}%,0)`);
        ctx.beginPath();
        ctx.arc(px, py, p.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      });

      // Arc lightning streaks when playing
      if (isPlaying) {
        const arcCount = 3;
        for (let a = 0; a < arcCount; a++) {
          const arcAngle = t * 0.7 + (a * Math.PI * 2) / arcCount;
          const x1 = cx + Math.cos(arcAngle) * orbR * 0.1;
          const y1 = cy + Math.sin(arcAngle) * orbR * 0.1;
          const x2 = cx + Math.cos(arcAngle + 0.3) * orbR * 0.95;
          const y2 = cy + Math.sin(arcAngle + 0.3) * orbR * 0.95;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          const mx = (x1 + x2) / 2 + Math.sin(t * 5 + a) * orbR * 0.15;
          const my = (y1 + y2) / 2 + Math.cos(t * 5 + a) * orbR * 0.15;
          ctx.quadraticCurveTo(mx, my, x2, y2);
          ctx.strokeStyle = `hsla(${h},100%,90%,${0.12 + 0.08 * Math.sin(t * 4 + a)})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }

      // Centre text
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      if (heartRate && isPlaying) {
        ctx.shadowColor = `hsla(${h},${s}%,${l}%,0.8)`;
        ctx.shadowBlur  = 12;
        ctx.font        = `700 ${Math.round(size * 0.14)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle   = `hsla(${h},100%,88%,0.95)`;
        ctx.fillText(`${heartRate}`, cx, cy - size * 0.045);
        ctx.font        = `600 ${Math.round(size * 0.055)}px 'Inter', sans-serif`;
        ctx.fillStyle   = `hsla(${h},${s}%,${l}%,0.7)`;
        ctx.fillText('BPM', cx, cy + size * 0.06);
        ctx.shadowBlur  = 0;
      } else if (!isPlaying) {
        ctx.shadowColor = `hsla(${h},${s}%,${l}%,0.5)`;
        ctx.shadowBlur  = 8;
        ctx.font        = `600 ${Math.round(size * 0.07)}px 'Inter', sans-serif`;
        ctx.fillStyle   = `hsla(${h},80%,80%,0.75)`;
        ctx.fillText('Tap to begin', cx, cy);
        ctx.shadowBlur  = 0;
      }
    };

    draw();
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [brainwave, isPlaying, heartRate, binauralHz, size]);

  return <canvas ref={canvasRef} style={{ borderRadius: '50%', display: 'block' }} />;
}
