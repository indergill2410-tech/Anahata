import React, { useRef, useEffect } from 'react';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  opacity: number;
  hue: number;
}

interface Props {
  brainwave?: string;
  isPlaying?: boolean;
  bpm?: number;
}

const BW_HUE: Record<string, number> = {
  Delta: 210, Theta: 270, Alpha: 150, Beta: 210, Gamma: 45,
};

export default function AntiGravityCanvas({ brainwave = 'Theta', isPlaying = false, bpm = 60 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef<{ particles: Particle[]; mouse: { x: number; y: number }; raf: number }>({
    particles: [], mouse: { x: -1000, y: -1000 }, raf: 0,
  });

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

    const COUNT = 180;
    const W = () => canvas.width;
    const H = () => canvas.height;

    stateRef.current.particles = Array.from({ length: COUNT }, () => ({
      x:       Math.random() * window.innerWidth,
      y:       Math.random() * window.innerHeight,
      vx:      (Math.random() - 0.5) * 0.4,
      vy:      (Math.random() - 0.5) * 0.4,
      radius:  0.8 + Math.random() * 1.8,
      opacity: 0.15 + Math.random() * 0.45,
      hue:     BW_HUE[brainwave] ?? 270,
    }));

    const onMove = (e: MouseEvent | TouchEvent) => {
      const pos = 'touches' in e ? e.touches[0] : e;
      stateRef.current.mouse = { x: pos.clientX, y: pos.clientY };
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove as EventListener);

    const draw = () => {
      stateRef.current.raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W(), H());

      const hue      = BW_HUE[brainwave] ?? 270;
      const speedMul = isPlaying ? (bpm / 60) : 0.3;
      const { mouse, particles } = stateRef.current;

      // Update
      particles.forEach(p => {
        // Drift
        p.x += p.vx * speedMul;
        p.y += p.vy * speedMul;

        // Wrap
        if (p.x < 0) p.x = W();
        if (p.x > W()) p.x = 0;
        if (p.y < 0) p.y = H();
        if (p.y > H()) p.y = 0;

        // Mouse repulsion
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120 && dist > 0) {
          const force = (120 - dist) / 120;
          p.vx += (dx / dist) * force * 0.18;
          p.vy += (dy / dist) * force * 0.18;
        }

        // Damping
        p.vx *= 0.98;
        p.vy *= 0.98;

        // Keep min speed
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed < 0.1) { p.vx += (Math.random() - 0.5) * 0.05; p.vy += (Math.random() - 0.5) * 0.05; }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue},70%,65%,${p.opacity})`;
        ctx.fill();
      });

      // Connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) {
            const alpha = (1 - d / 110) * 0.12;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `hsla(${hue},60%,60%,${alpha})`;
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
