import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useSimulator — realistic HR simulation for demo mode
 * Simulates a meditation session: HR drifts from ~82 down to ~58 over time
 */
export function useSimulator() {
  const [active, setActive]       = useState(false);
  const [heartRate, setHeartRate] = useState(null);
  const intervalRef = useRef(null);
  const phaseRef    = useRef(0); // 0=baseline 1=descending 2=deep 3=rising
  const hrRef       = useRef(80);

  const tick = useCallback(() => {
    phaseRef.current += 1;
    const phase = phaseRef.current;
    let target;
    if (phase < 30)       target = 82; // baseline
    else if (phase < 90)  target = 68; // settling
    else if (phase < 180) target = 58; // deep meditation
    else if (phase < 220) target = 62; // gentle rise
    else                  target = 65; // stable rest

    const noise = (Math.random() - 0.5) * 3;
    const step  = (target - hrRef.current) * 0.08 + noise;
    hrRef.current = Math.max(45, Math.min(110, hrRef.current + step));
    setHeartRate(Math.round(hrRef.current));
  }, []);

  const start = useCallback(() => {
    phaseRef.current = 0;
    hrRef.current    = 78 + Math.floor(Math.random() * 8);
    setHeartRate(hrRef.current);
    setActive(true);
    intervalRef.current = setInterval(tick, 1000);
  }, [tick]);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    setActive(false);
    setHeartRate(null);
  }, []);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return { active, heartRate, start, stop };
}
