import React, { useRef, useEffect } from 'react';

interface Particle { angle: number; radius: number; speed: number; size: number; phase: number; drift: number; }

const BW_PALETTE: Record<string, { core: string; mid: string; glow: string }> = {
  Delta:  { core: '#4A7FA5', mid: '#7AABCC', glow: 'rgba(74,127,165,0.18)'  },
  Theta:  { core: '#9B6B9A', mid: '#C49BC3', glow: 'rgba(155,107,154,0.18)' },
  Alpha:  { core: '#7B8B5E', mid: '#A8BA7F', glow: 'rgba(123,139,94,0.18)'  },
  Beta:   { core: '#4A7FA5', mid: '#82B4D4', glow: 'rgba(74,127,165,0.18)'  },
  Gamma:  { core: '#D4A853', mid: '#EFD08A', glow: 'rgba(212,168,83,0.22)'  },
};

const PARTICLE_COUNT = 48;

interface OrbVisualizerProps { brainwave?: string; isPlaying: boolean; heartRate?: number; binauralHz?: number; size?: number; }

export default function OrbVisualizer({ brainwave = 'Theta', isPlaying, heartRate, binauralHz = 6, size = 260 }: OrbVisualizerProps) {
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
      radius: size * 0.22 + Math.random() * size * 0.14,
      speed:  0.003 + Math.random() * 0.006,
      size:   1 + Math.random() * 2.5,
      phase:  Math.random() * Math.PI * 2,
      drift:  (Math.random() - 0.5) * 0.002,
    }));

    const cx = size / 2, cy = size / 2;
    const baseR = size * 0.22;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      stateRef.current.t += 0.012;
      const t = stateRef.current.t;

      ctx.clearRect(0, 0, size, size);

      const pal       = BW_PALETTE[brainwave] || BW_PALETTE.Theta;
      const breathHz  = Math.min(binauralHz, 0.5);
      const breathAmp = isPlaying ? 0.06 : 0.02;
      const scale     = 1 + breathAmp * Math.sin(2 * Math.PI * breathHz * t);
      const orbR      = baseR * scale;

      // Outer glow rings
      for (let i = 3; i >= 1; i--) {
        const grd = ctx.createRadialGradient(cx, cy, orbR * 0.5, cx, cy, orbR * (1 + i * 0.45));
        const alpha = (0.12 / i).toFixed(2);
        grd.addColorStop(0, pal.glow.replace(/[\d.]+\)$/, `${alpha})`));
        grd.addColorStop(1, 'rgba(250,247,242,0)');
        ctx.beginPath();
        ctx.arc(cx, cy, orbR * (1 + i * 0.45), 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      // Watercolour orb body
      const bodyGrad = ctx.createRadialGradient(cx - orbR * 0.2, cy - orbR * 0.2, orbR * 0.05, cx, cy, orbR);
      bodyGrad.addColorStop(0, `${pal.mid}CC`);
      bodyGrad.addColorStop(0.5, `${pal.core}99`);
      bodyGrad.addColorStop(1, `${pal.core}44`);
      ctx.beginPath();
      ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // Shimmer highlight
      const hiGrad = ctx.createRadialGradient(cx - orbR * 0.3, cy - orbR * 0.35, 0, cx - orbR * 0.3, cy - orbR * 0.35, orbR * 0.6);
      hiGrad.addColorStop(0, 'rgba(255,252,248,0.55)');
      hiGrad.addColorStop(1, 'rgba(255,252,248,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
      ctx.fillStyle = hiGrad;
      ctx.fill();

      // Particles
      stateRef.current.particles.forEach(p => {
        p.angle += p.speed * (isPlaying ? 1 : 0.2) + p.drift;
        const wobble = Math.sin(t * 1.5 + p.phase) * size * 0.025;
        const px     = cx + Math.cos(p.angle) * (p.radius + wobble);
        const py     = cy + Math.sin(p.angle) * (p.radius + wobble);
        const alpha  = isPlaying ? (0.4 + 0.4 * Math.sin(t * 2 + p.phase)) : 0.15;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${pal.core}${Math.round(alpha * 255).toString(16).padStart(2,'0')}`;
        ctx.fill();
      });

      // Centre text
      ctx.textAlign     = 'center';
      ctx.textBaseline  = 'middle';
      if (heartRate && isPlaying) {
        ctx.font      = `bold ${Math.round(size * 0.12)}px Inter, sans-serif`;
        ctx.fillStyle = `${pal.core}EE`;
        ctx.fillText(`${heartRate}`, cx, cy - size * 0.045);
        ctx.font      = `${Math.round(size * 0.055)}px Inter, sans-serif`;
        ctx.fillStyle = `${pal.core}99`;
        ctx.fillText('BPM', cx, cy + size * 0.055);
      } else if (!isPlaying) {
        ctx.font      = `${Math.round(size * 0.065)}px Inter, sans-serif`;
        ctx.fillStyle = `${pal.core}BB`;
        ctx.fillText('Tap to begin', cx, cy);
      }
    };

    draw();
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [brainwave, isPlaying, heartRate, binauralHz, size]);

  return <canvas ref={canvasRef} style={{ borderRadius: '50%', display: 'block' }} />;
}
