import React, { useRef, useEffect } from 'react';

export default function SpectrumAnalyser({ analyser, isPlaying, height = 60 }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width  = W * window.devicePixelRatio;
    canvas.height = H * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const BAR_COUNT = 48;
    const data = new Uint8Array(analyser ? analyser.frequencyBinCount : BAR_COUNT);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(data);
      } else {
        // idle: gentle random noise floor
        for (let i = 0; i < BAR_COUNT; i++) {
          data[i] = Math.random() * 8 + 4;
        }
      }

      const barW = (W / BAR_COUNT) - 1.5;
      const grad = ctx.createLinearGradient(0, H, 0, 0);
      grad.addColorStop(0, 'rgba(123,139,94,0.8)');
      grad.addColorStop(0.5, 'rgba(212,168,83,0.7)');
      grad.addColorStop(1, 'rgba(196,97,58,0.9)');

      const step = Math.floor(data.length / BAR_COUNT);
      for (let i = 0; i < BAR_COUNT; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) sum += data[i * step + j] || 0;
        const avg = sum / step;
        const barH = Math.max(2, (avg / 255) * H);
        const x = i * (barW + 1.5);
        ctx.fillStyle = grad;
        const radius = Math.min(barW / 2, 2);
        ctx.beginPath();
        ctx.roundRect(x, H - barH, barW, barH, radius);
        ctx.fill();
      }
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyser, isPlaying]);

  return <canvas ref={canvasRef} className="spectrum-canvas" style={{ height }} />;
}
