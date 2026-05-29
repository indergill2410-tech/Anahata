import { useState, useRef, useCallback } from 'react';

// Simulates a realistic heart rate that slowly decreases as meditation deepens
export function useSimulator(onHeartRate) {
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  const hrRef = useRef(82);

  const start = useCallback(() => {
    if (running) return;
    setRunning(true);
    intervalRef.current = setInterval(() => {
      // Slowly drift down with realistic variation
      const drift = hrRef.current > 58 ? -0.15 : 0;
      const noise = (Math.random() - 0.5) * 2.5;
      hrRef.current = Math.max(52, Math.min(100, hrRef.current + drift + noise));
      onHeartRate(Math.round(hrRef.current));
    }, 1200);
  }, [running, onHeartRate]);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    hrRef.current = 82;
    setRunning(false);
  }, []);

  return { running, start, stop };
}
