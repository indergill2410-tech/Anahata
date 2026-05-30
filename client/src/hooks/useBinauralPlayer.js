import { useRef, useState, useEffect, useCallback } from 'react';

const DRONE_ROOT = 110; // A2 — warm, low root note for all tracks

function buildDrone(ctx, masterGain) {
  const droneGain = ctx.createGain();
  droneGain.gain.setValueAtTime(0, ctx.currentTime);
  droneGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 3);
  droneGain.connect(masterGain);

  const nodes = [];
  // Four harmonics of the root note with decreasing amplitude
  [1, 2, 3, 4].forEach((h, i) => {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = DRONE_ROOT * h;
    osc.detune.value = (i % 2 === 0 ? 1 : -1) * (i + 1) * 1.5; // slight warmth detuning
    g.gain.value = 0.35 / (i + 1);
    osc.connect(g);
    g.connect(droneGain);
    osc.start();
    nodes.push(osc);
  });
  return nodes;
}

function buildBinaural(ctx, masterGain, carrierHz, binauralHz) {
  const nodes = [];

  const leftGain  = ctx.createGain();
  const rightGain = ctx.createGain();
  leftGain.gain.value  = 0.4;
  rightGain.gain.value = 0.4;

  const merger = ctx.createChannelMerger(2);
  leftGain.connect(merger, 0, 0);
  rightGain.connect(merger, 0, 1);
  merger.connect(masterGain);

  const leftOsc  = ctx.createOscillator();
  leftOsc.type = 'sine';
  leftOsc.frequency.value = carrierHz;
  leftOsc.connect(leftGain);
  leftOsc.start();
  nodes.push(leftOsc);

  const rightOsc = ctx.createOscillator();
  rightOsc.type = 'sine';
  rightOsc.frequency.value = carrierHz + binauralHz;
  rightOsc.connect(rightGain);
  rightOsc.start();
  nodes.push(rightOsc);

  return nodes;
}

export function useBinauralPlayer() {
  const ctxRef       = useRef(null);
  const nodesRef     = useRef([]);
  const masterRef    = useRef(null);
  const startRef     = useRef(0);   // audioContext.currentTime when playback started
  const offsetRef    = useRef(0);   // accumulated elapsed seconds before last pause
  const tickRef      = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed,   setElapsed]   = useState(0);
  const [volume,    setVolumeState] = useState(0.7);

  function stopNodes() {
    nodesRef.current.forEach(n => { try { n.stop(); } catch {} });
    nodesRef.current = [];
  }

  const setVolume = useCallback((v) => {
    setVolumeState(v);
    if (masterRef.current) masterRef.current.gain.setTargetAtTime(v, ctxRef.current.currentTime, 0.05);
  }, []);

  const play = useCallback((track) => {
    stopNodes();
    clearInterval(tickRef.current);

    const ctx = ctxRef.current || new (window.AudioContext || window.webkitAudioContext)();
    ctxRef.current = ctx;
    if (ctx.state === 'suspended') ctx.resume();

    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(volume, ctx.currentTime + 2); // 2s fade-in
    master.connect(ctx.destination);
    masterRef.current = master;

    const { carrierHz = 200, binauralHz = 10 } = track;

    const binauralNodes = buildBinaural(ctx, master, carrierHz, binauralHz);
    const droneNodes    = buildDrone(ctx, master);
    nodesRef.current    = [...binauralNodes, ...droneNodes];

    offsetRef.current = 0;
    startRef.current  = ctx.currentTime;
    setElapsed(0);
    setIsPlaying(true);

    tickRef.current = setInterval(() => {
      setElapsed(Math.floor(offsetRef.current + (ctx.currentTime - startRef.current)));
    }, 500);
  }, [volume]);

  const toggle = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    if (ctx.state === 'running') {
      // Fade out then suspend
      masterRef.current?.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
      setTimeout(() => ctx.suspend(), 800);
      offsetRef.current += ctx.currentTime - startRef.current;
      clearInterval(tickRef.current);
      setIsPlaying(false);
    } else if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        masterRef.current?.gain.setTargetAtTime(volume, ctx.currentTime, 0.3);
        startRef.current = ctx.currentTime;
        tickRef.current = setInterval(() => {
          setElapsed(Math.floor(offsetRef.current + (ctx.currentTime - startRef.current)));
        }, 500);
        setIsPlaying(true);
      });
    }
  }, [volume]);

  const stop = useCallback(() => {
    if (masterRef.current && ctxRef.current) {
      masterRef.current.gain.setTargetAtTime(0, ctxRef.current.currentTime, 0.3);
    }
    setTimeout(() => {
      stopNodes();
      ctxRef.current?.suspend();
    }, 600);
    clearInterval(tickRef.current);
    offsetRef.current = 0;
    setElapsed(0);
    setIsPlaying(false);
  }, []);

  // cleanup on unmount
  useEffect(() => () => {
    stopNodes();
    clearInterval(tickRef.current);
    ctxRef.current?.close();
  }, []);

  return { isPlaying, elapsed, volume, play, toggle, stop, setVolume };
}
