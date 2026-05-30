import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';

// ── Intention presets ──────────────────────────────────────────────────────
export const INTENTIONS = {
  sleep:    { label: 'Sleep',    emoji: '😴', binauralHz: 2,  carrierHz: 180, drone: 'tanpura',  instrument: null,      nature: 'rain',   solfeggio: 528  },
  focus:    { label: 'Focus',    emoji: '🎯', binauralHz: 18, carrierHz: 200, drone: 'shruti',   instrument: 'bansuri', nature: null,     solfeggio: 741  },
  heal:     { label: 'Heal',     emoji: '💜', binauralHz: 7,  carrierHz: 210, drone: 'bowl',     instrument: null,      nature: 'forest', solfeggio: 396  },
  energize: { label: 'Energize', emoji: '⚡', binauralHz: 20, carrierHz: 240, drone: 'shruti',   instrument: 'tabla',   nature: null,     solfeggio: 417  },
  meditate: { label: 'Meditate', emoji: '🧘', binauralHz: 6,  carrierHz: 200, drone: 'om',       instrument: 'sitar',   nature: 'river',  solfeggio: 528  },
};

export const DRONE_OPTIONS      = ['tanpura','shruti','bowl','om'];
export const INSTRUMENT_OPTIONS = ['bansuri','sitar','tabla','sarod'];
export const NATURE_OPTIONS     = ['rain','ocean','river','wind','forest'];
export const SOLFEGGIO_OPTIONS  = [174, 285, 396, 417, 528, 639, 741, 852, 963];
export const BINAURAL_PRESETS   = [
  { label: 'Delta 2Hz', hz: 2,  carrier: 180 },
  { label: 'Theta 6Hz', hz: 6,  carrier: 200 },
  { label: 'Alpha 10Hz',hz: 10, carrier: 220 },
  { label: 'Beta 18Hz', hz: 18, carrier: 200 },
  { label: 'Gamma 40Hz',hz: 40, carrier: 200 },
];

export const BW_FOR_HZ = (hz) => {
  if (hz <= 4)  return 'Delta';
  if (hz <= 8)  return 'Theta';
  if (hz <= 14) return 'Alpha';
  if (hz <= 30) return 'Beta';
  return 'Gamma';
};

// ── Noise buffer helper ────────────────────────────────────────────────────
function noiseBuffer(ctx, secs = 3) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * secs, ctx.sampleRate);
  const d   = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function loopNoise(ctx, destination) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  src.loop = true;
  src.connect(destination);
  src.start();
  return src;
}

// ── Layer builders ─────────────────────────────────────────────────────────
function buildBinaural(ctx, dst, hz, carrier) {
  const nodes = [];
  const merger = ctx.createChannelMerger(2);
  merger.connect(dst);

  const left  = ctx.createOscillator(); left.type = 'sine';  left.frequency.value  = carrier;
  const right = ctx.createOscillator(); right.type = 'sine'; right.frequency.value = carrier + hz;
  const lg = ctx.createGain(); lg.gain.value = 0.5;
  const rg = ctx.createGain(); rg.gain.value = 0.5;
  left.connect(lg);  lg.connect(merger, 0, 0);
  right.connect(rg); rg.connect(merger, 0, 1);
  left.start(); right.start();
  nodes.push(left, right);
  return { nodes, leftOsc: left, rightOsc: right };
}

function buildDrone(ctx, dst, type) {
  const nodes = [];
  const g = ctx.createGain(); g.gain.value = 1; g.connect(dst);

  if (type === 'tanpura') {
    // Sa Pa Sa SA — A2: 110, 165, 220, 440 Hz
    [110, 165, 220, 440].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const og  = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = f;
      osc.detune.value = (i % 2 === 0 ? 1 : -1) * (i + 1) * 2;
      og.gain.value = 0.35 / (i * 0.6 + 1);
      osc.connect(og); og.connect(g); osc.start(); nodes.push(osc);
    });
  } else if (type === 'shruti') {
    // Harmonium-like: C3 chord with harmonics
    [130.8, 196, 261.6, 392, 523].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const og  = ctx.createGain();
      osc.type = i < 2 ? 'sawtooth' : 'sine';
      osc.frequency.value = f;
      og.gain.value = 0.2 / (i + 1);
      osc.connect(og); og.connect(g); osc.start(); nodes.push(osc);
    });
  } else if (type === 'bowl') {
    // Tibetan bowl: 200Hz with AM tremolo + harmonics
    const baseFreq = 200;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.8; lfo.type = 'sine';
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.15;
    lfo.connect(lfoG); lfoG.connect(g.gain); lfo.start(); nodes.push(lfo);
    [1, 2.76, 5.4].forEach((ratio, i) => {
      const osc = ctx.createOscillator();
      const og  = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = baseFreq * ratio;
      og.gain.value = 0.4 / (i + 1);
      osc.connect(og); og.connect(g); osc.start(); nodes.push(osc);
    });
  } else if (type === 'om') {
    // G2 (98Hz) low drone with vowel formant filter sweep
    const base = 98;
    [1, 2, 3, 4, 6].forEach((h, i) => {
      const osc = ctx.createOscillator();
      const og  = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = base * h;
      og.gain.value = 0.35 / (i + 1);
      osc.connect(og); og.connect(g); osc.start(); nodes.push(osc);
    });
    // Slow LFO filter for the "mmm" quality
    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass'; filt.frequency.value = 300; filt.Q.value = 2;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.15;
    const lfoG = ctx.createGain(); lfoG.gain.value = 150;
    lfo.connect(lfoG); lfoG.connect(filt.frequency); lfo.start(); nodes.push(lfo);
  }
  return nodes;
}

function buildInstrument(ctx, dst, type, bpm = 60) {
  const nodes = [];
  const g = ctx.createGain(); g.gain.value = 1; g.connect(dst);

  if (type === 'bansuri') {
    // Breathy flute: sine + noise blend + vibrato
    const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 392; // G4
    const vibrato = ctx.createOscillator(); vibrato.frequency.value = 5; vibrato.type = 'sine';
    const vibratoG = ctx.createGain(); vibratoG.gain.value = 8;
    vibrato.connect(vibratoG); vibratoG.connect(osc.frequency);
    const noiseG = ctx.createGain(); noiseG.gain.value = 0.08;
    const filt = ctx.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 400; filt.Q.value = 3;
    const ns = loopNoise(ctx, filt); filt.connect(noiseG); noiseG.connect(g);
    osc.connect(g); osc.start(); vibrato.start();
    nodes.push(osc, vibrato, ns);
  } else if (type === 'sitar') {
    // Periodic plucked string: fast attack + slow exponential decay, re-trigger
    const interval = (60 / bpm) * 1000;
    function pluck() {
      if (!ctx || ctx.state === 'closed') return;
      const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 261.6;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.4, ctx.currentTime);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
      // Sympathetic resonance filter
      const filt = ctx.createBiquadFilter(); filt.type = 'peaking'; filt.frequency.value = 523; filt.gain.value = 6;
      osc.connect(filt); filt.connect(env); env.connect(g);
      osc.start(); osc.stop(ctx.currentTime + 2);
    }
    pluck();
    const id = setInterval(pluck, interval);
    nodes._sitarInterval = id;
    nodes.push({ _isSitar: true, id });
  } else if (type === 'tabla') {
    const interval = (60 / bpm) * 500; // 2 beats per bar
    function hit(freq = 220, decay = 0.25) {
      if (!ctx || ctx.state === 'closed') return;
      const osc = ctx.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 2.5, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq, ctx.currentTime + 0.04);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.6, ctx.currentTime);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + decay);
      osc.connect(env); env.connect(g);
      osc.start(); osc.stop(ctx.currentTime + decay + 0.05);
    }
    let beat = 0;
    const rhythmPattern = [1, 0, 0.6, 0, 1, 0, 0.7, 0]; // simple keherwa
    hit(220, 0.3);
    const id = setInterval(() => {
      const v = rhythmPattern[beat % rhythmPattern.length];
      if (v > 0) hit(v > 0.8 ? 220 : 150, v > 0.8 ? 0.3 : 0.2);
      beat++;
    }, interval);
    nodes._tablaInterval = id;
    nodes.push({ _isTick: true, id });
  } else if (type === 'sarod') {
    // Similar to sitar but lower register, slightly different timbre
    const interval = (60 / bpm) * 2000;
    function pluckSarod() {
      if (!ctx || ctx.state === 'closed') return;
      const osc = ctx.createOscillator(); osc.type = 'triangle'; osc.frequency.value = 130.8;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.5, ctx.currentTime);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3);
      osc.connect(env); env.connect(g);
      osc.start(); osc.stop(ctx.currentTime + 3.1);
    }
    pluckSarod();
    const id = setInterval(pluckSarod, interval);
    nodes._sarodInterval = id;
    nodes.push({ _isTick: true, id });
  }
  return nodes;
}

function buildNature(ctx, dst, type) {
  const nodes = [];
  const g = ctx.createGain(); g.gain.value = 1; g.connect(dst);

  if (type === 'rain') {
    const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 2500; filt.Q.value = 0.5;
    filt.connect(g);
    const ns = loopNoise(ctx, filt); nodes.push(ns);
    // Occasional heavier drops
    const dropFilt = ctx.createBiquadFilter(); dropFilt.type = 'bandpass'; dropFilt.frequency.value = 800; dropFilt.Q.value = 1;
    const dropG = ctx.createGain(); dropG.gain.value = 0.4;
    dropFilt.connect(dropG); dropG.connect(g);
    const ns2 = loopNoise(ctx, dropFilt); nodes.push(ns2);
  } else if (type === 'ocean') {
    const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 500;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.08; lfo.type = 'sine';
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.4;
    lfo.connect(lfoG); lfoG.connect(g.gain);
    filt.connect(g); lfo.start(); nodes.push(lfo);
    const ns = loopNoise(ctx, filt); nodes.push(ns);
  } else if (type === 'river') {
    const filt = ctx.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 800; filt.Q.value = 0.8;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.3; lfo.type = 'sine';
    const lfoG = ctx.createGain(); lfoG.gain.value = 200;
    lfo.connect(lfoG); lfoG.connect(filt.frequency);
    filt.connect(g); lfo.start(); nodes.push(lfo);
    const ns = loopNoise(ctx, filt); nodes.push(ns);
  } else if (type === 'wind') {
    const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 400;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.12; lfo.type = 'sine';
    const lfoG = ctx.createGain(); lfoG.gain.value = 200;
    lfo.connect(lfoG); lfoG.connect(filt.frequency);
    filt.connect(g); lfo.start(); nodes.push(lfo);
    const ns = loopNoise(ctx, filt); nodes.push(ns);
  } else if (type === 'forest') {
    // Base noise (quiet)
    const filt = ctx.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 2000; filt.Q.value = 0.3;
    const baseG = ctx.createGain(); baseG.gain.value = 0.3;
    filt.connect(baseG); baseG.connect(g);
    const ns = loopNoise(ctx, filt); nodes.push(ns);
    // Sparse bird chirps
    function chirp() {
      if (!ctx || ctx.state === 'closed') return;
      const osc = ctx.createOscillator(); osc.type = 'sine';
      const freq = 2000 + Math.random() * 2000;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(freq * 1.3, ctx.currentTime + 0.08);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.15, ctx.currentTime);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(env); env.connect(g);
      osc.start(); osc.stop(ctx.currentTime + 0.2);
    }
    chirp();
    const id = setInterval(chirp, 2000 + Math.random() * 4000);
    nodes._chirpInterval = id;
    nodes.push({ _isTick: true, id });
  }
  return nodes;
}

function buildSolfeggio(ctx, dst, hz) {
  const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = hz;
  // Add slight harmonics for warmth
  const osc2 = ctx.createOscillator(); osc2.type = 'sine'; osc2.frequency.value = hz * 2;
  const g1 = ctx.createGain(); g1.gain.value = 0.7;
  const g2 = ctx.createGain(); g2.gain.value = 0.15;
  osc.connect(g1); g1.connect(dst);
  osc2.connect(g2); g2.connect(dst);
  osc.start(); osc2.start();
  return [osc, osc2];
}

function stopNodes(nodes) {
  (nodes || []).forEach(n => {
    if (n._isTick || n._isSitar || n._isSarod) { clearInterval(n.id); return; }
    if (n._chirpInterval) { clearInterval(n._chirpInterval); return; }
    if (n._sitarInterval) { clearInterval(n._sitarInterval); return; }
    if (n._tablaInterval) { clearInterval(n._tablaInterval); return; }
    if (n._sarodInterval) { clearInterval(n._sarodInterval); return; }
    try { n.stop(); } catch {}
  });
}

// ── Context ────────────────────────────────────────────────────────────────
const SoundEngineContext = createContext(null);

const DEFAULT_VOLUMES = { binaural: 0.5, drone: 0.6, instrument: 0.0, nature: 0.0, solfeggio: 0.3 };
const DEFAULT_SETTINGS = {
  binaural:   { hz: 7, carrier: 200 },
  drone:      { type: 'tanpura' },
  instrument: { type: 'bansuri' },
  nature:     { type: 'rain' },
  solfeggio:  { hz: 528 },
};

export function SoundEngineProvider({ children }) {
  const ctxRef     = useRef(null);
  const masterRef  = useRef(null);
  const gainRefs   = useRef({});   // gainNode per layer
  const nodeRefs   = useRef({});   // active nodes per layer
  const binauralRef = useRef(null); // { leftOsc, rightOsc } for live adaptation
  const tickRef    = useRef(null);
  const startRef   = useRef(0);
  const offsetRef  = useRef(0);

  const [isPlaying,  setIsPlaying]  = useState(false);
  const [elapsed,    setElapsed]    = useState(0);
  const [intention,  setIntention]  = useState(null);
  const [volumes,    setVolumes]    = useState(DEFAULT_VOLUMES);
  const [settings,   setSettings]   = useState(DEFAULT_SETTINGS);
  const [brainwave,  setBrainwave]  = useState('Theta');

  function getCtx() {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctxRef.current;
  }

  function buildLayer(ctx, layerName, layerSettings, layerVolume) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(layerVolume, ctx.currentTime + 2);
    g.connect(masterRef.current);
    gainRefs.current[layerName] = g;

    let nodes = [];
    let binRef = null;

    if (layerName === 'binaural') {
      const result = buildBinaural(ctx, g, layerSettings.hz, layerSettings.carrier);
      nodes = result.nodes;
      binRef = result;
    } else if (layerName === 'drone' && layerSettings.type) {
      nodes = buildDrone(ctx, g, layerSettings.type);
    } else if (layerName === 'instrument' && layerSettings.type) {
      nodes = buildInstrument(ctx, g, layerSettings.type);
    } else if (layerName === 'nature' && layerSettings.type) {
      nodes = buildNature(ctx, g, layerSettings.type);
    } else if (layerName === 'solfeggio' && layerSettings.hz) {
      nodes = buildSolfeggio(ctx, g, layerSettings.hz);
    }

    nodeRefs.current[layerName] = nodes;
    if (binRef) binauralRef.current = binRef;
  }

  const start = useCallback((overrideSettings, overrideVolumes) => {
    // Stop existing audio
    Object.values(nodeRefs.current).forEach(stopNodes);
    nodeRefs.current = {};
    clearInterval(tickRef.current);

    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.85, ctx.currentTime + 1.5);
    master.connect(ctx.destination);
    masterRef.current = master;

    const s = overrideSettings || settings;
    const v = overrideVolumes  || volumes;

    ['binaural', 'drone', 'instrument', 'nature', 'solfeggio'].forEach(layer => {
      buildLayer(ctx, layer, s[layer], v[layer]);
    });

    setBrainwave(BW_FOR_HZ(s.binaural.hz));
    offsetRef.current = 0;
    startRef.current  = ctx.currentTime;
    setElapsed(0);
    setIsPlaying(true);

    tickRef.current = setInterval(() => {
      if (ctxRef.current?.state === 'running') {
        setElapsed(Math.floor(offsetRef.current + (ctxRef.current.currentTime - startRef.current)));
      }
    }, 1000);
  }, [settings, volumes]);

  const stop = useCallback(() => {
    if (masterRef.current && ctxRef.current) {
      masterRef.current.gain.setTargetAtTime(0, ctxRef.current.currentTime, 0.4);
    }
    setTimeout(() => {
      Object.values(nodeRefs.current).forEach(stopNodes);
      nodeRefs.current = {};
      ctxRef.current?.suspend();
    }, 800);
    clearInterval(tickRef.current);
    offsetRef.current = 0;
    setElapsed(0);
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !isPlaying) { start(); return; }
    if (ctx.state === 'running') {
      masterRef.current?.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
      setTimeout(() => ctx.suspend(), 700);
      offsetRef.current += ctx.currentTime - startRef.current;
      clearInterval(tickRef.current);
      setIsPlaying(false);
    } else {
      ctx.resume().then(() => {
        masterRef.current?.gain.setTargetAtTime(volumes.binaural > 0 ? 0.85 : 0.5, ctx.currentTime, 0.3);
        startRef.current = ctx.currentTime;
        tickRef.current = setInterval(() => {
          setElapsed(Math.floor(offsetRef.current + (ctx.currentTime - startRef.current)));
        }, 1000);
        setIsPlaying(true);
      });
    }
  }, [isPlaying, start, volumes]);

  const setLayerVolume = useCallback((layer, vol) => {
    setVolumes(v => {
      const next = { ...v, [layer]: vol };
      if (gainRefs.current[layer] && ctxRef.current) {
        gainRefs.current[layer].gain.setTargetAtTime(vol, ctxRef.current.currentTime, 0.1);
      }
      return next;
    });
  }, []);

  const updateLayerSetting = useCallback((layer, newSettings) => {
    setSettings(s => {
      const next = { ...s, [layer]: { ...s[layer], ...newSettings } };
      if (isPlaying && ctxRef.current) {
        // Rebuild just this layer
        stopNodes(nodeRefs.current[layer] || []);
        nodeRefs.current[layer] = [];
        if (gainRefs.current[layer]) {
          try { gainRefs.current[layer].disconnect(); } catch {}
        }
        buildLayer(ctxRef.current, layer, next[layer], volumes[layer]);
        if (layer === 'binaural') setBrainwave(BW_FOR_HZ(next.binaural.hz));
      }
      return next;
    });
  }, [isPlaying, volumes]);

  // Phase 4: live binaural adaptation from heart rate
  const adaptFromHeartRate = useCallback((hr) => {
    if (!hr || !isPlaying) return;
    let targetHz;
    if (hr > 100) targetHz = 10;      // Alpha — calm down
    else if (hr > 85) targetHz = 12;  // Alpha
    else if (hr > 70) targetHz = 7;   // Theta — meditative
    else if (hr < 55) targetHz = 18;  // Beta — energise
    else targetHz = settings.binaural.hz; // keep current

    const bin = binauralRef.current;
    const ctx = ctxRef.current;
    if (bin && ctx && Math.abs(targetHz - settings.binaural.hz) > 1) {
      const carrier = settings.binaural.carrier;
      bin.rightOsc.frequency.setTargetAtTime(carrier + targetHz, ctx.currentTime, 3);
      setSettings(s => ({ ...s, binaural: { ...s.binaural, hz: targetHz } }));
      setBrainwave(BW_FOR_HZ(targetHz));
    }
  }, [isPlaying, settings]);

  const applyIntention = useCallback((name) => {
    const p = INTENTIONS[name];
    if (!p) return;
    const newSettings = {
      binaural:   { hz: p.binauralHz, carrier: p.carrierHz },
      drone:      { type: p.drone },
      instrument: { type: p.instrument },
      nature:     { type: p.nature },
      solfeggio:  { hz: p.solfeggio },
    };
    const newVolumes = {
      binaural:   0.5,
      drone:      p.drone      ? 0.65 : 0,
      instrument: p.instrument ? 0.4  : 0,
      nature:     p.nature     ? 0.45 : 0,
      solfeggio:  p.solfeggio  ? 0.3  : 0,
    };
    setSettings(newSettings);
    setVolumes(newVolumes);
    setIntention(name);
    start(newSettings, newVolumes);
  }, [start]);

  useEffect(() => () => {
    Object.values(nodeRefs.current).forEach(stopNodes);
    clearInterval(tickRef.current);
    ctxRef.current?.close();
  }, []);

  return (
    <SoundEngineContext.Provider value={{
      isPlaying, elapsed, intention, volumes, settings, brainwave,
      start, stop, togglePlay, setLayerVolume, updateLayerSetting,
      applyIntention, adaptFromHeartRate,
    }}>
      {children}
    </SoundEngineContext.Provider>
  );
}

export function useSoundEngine() {
  return useContext(SoundEngineContext);
}
