import React, { useRef, useEffect } from 'react';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  baseOpacity: number;
  hue: number;
  hueOffset: number;
  pulse: number;
}

interface Props { brainwave?: string; isPlaying?: boolean; bpm?: number; }

const BW_HUE: Record<string, number> = {
  Delta: 210, Theta: 270, Alpha: 160, Beta: 200, Gamma: 42,
};

export default function AntiGravityCanvas({ brainwave = 'Theta', isPlaying = false, bpm = 60 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef<{
    particles: Particle[];
    mouse: { x: number; y: number };
    raf: number;
    t: number;
  }>({ particles: [], mouse: { x: -1000, y: -1000 }, raf: 0, t: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const COUNT = 90;

    stateRef.current.particles = Array.from({ length: COUNT }, () => {
      const h = BW_HUE[brainwave] ?? 270;
      return {
        x:           Math.random() * window.innerWidth,
        y:           Math.random() * window.innerHeight,
        vx:          (Math.random() - 0.5) * 0.5,
        vy:          (Math.random() - 0.5) * 0.5,
        radius:      0.8 + Math.random() * 2.2,
        baseOpacity: 0.15 + Math.random() * 0.20,
        hue:         h,
        hueOffset:   (Math.random() - 0.5) * 40,
        pulse:       Math.random() * Math.PI * 2,
      };
    });

    const onMove = (e: MouseEvent | TouchEvent) => {
      const pos = 'touches' in e ? e.touches[0] : e;
      stateRef.current.mouse = { x: pos.clientX, y: pos.clientY };
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove as EventListener, { passive: true });

    const draw = () => {
      stateRef.current.raf = requestAnimationFrame(draw);
      stateRef.current.t += 0.008;
      const t = stateRef.current.t;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const baseHue  = BW_HUE[brainwave] ?? 270;
      const speedMul = isPlaying ? Math.max(bpm / 60, 0.6) : 0.25;
      const { mouse, particles } = stateRef.current;

      particles.forEach(p => {
        p.hue = baseHue + p.hueOffset;
        p.x  += p.vx * speedMul;
        p.y  += p.vy * speedMul;

        // Wrap
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width  + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        // Mouse repulsion
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140 && dist > 0) {
          const force = (140 - dist) / 140;
          p.vx += (dx / dist) * force * 0.22;
          p.vy += (dy / dist) * force * 0.22;
        }

        p.vx *= 0.98;
        p.vy *= 0.98;
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed < 0.08) {
          p.vx += (Math.random() - 0.5) * 0.06;
          p.vy += (Math.random() - 0.5) * 0.06;
        }

        // Pulsing opacity — soft pastels on light bg
        const pulseOpacity = Math.min(0.35, p.baseOpacity + (isPlaying ? 0.08 : 0.02) * Math.sin(t * 2.5 + p.pulse));

        // Draw with radial glow
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
        grd.addColorStop(0, `hsla(${p.hue},55%,72%,${pulseOpacity})`);
        grd.addColorStop(0.4, `hsla(${p.hue},50%,70%,${pulseOpacity * 0.5})`);
        grd.addColorStop(1, `hsla(${p.hue},45%,68%,0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      });

      // Constellation mesh
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d  = dx * dx + dy * dy;
          if (d < 120 * 120) {
            const dist = Math.sqrt(d);
            const alpha = (1 - dist / 120) * (isPlaying ? 0.12 : 0.06);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `hsla(${(a.hue + b.hue) / 2},50%,65%,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    draw();
    return () => {
      cancelAnimationFrame(stateRef.current.raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove as EventListener);
    };
  }, [brainwave, isPlaying, bpm]);

  return (
    <canvas
      ref={canvasRef}
      id="antigravity-canvas"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
}
