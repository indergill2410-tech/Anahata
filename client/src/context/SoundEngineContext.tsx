import React, { createContext, useContext, useRef, useState, useCallback, useEffect, ReactNode } from 'react';
import { PhraseEngine } from '../utils/PhraseEngine';

// ── Intention presets ────────────────────────────────────────────────────────
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
  { label: 'Delta 2Hz',  hz: 2,  carrier: 180 },
  { label: 'Theta 6Hz',  hz: 6,  carrier: 200 },
  { label: 'Alpha 10Hz', hz: 10, carrier: 220 },
  { label: 'Beta 18Hz',  hz: 18, carrier: 200 },
  { label: 'Gamma 40Hz', hz: 40, carrier: 200 },
];

export const BW_FOR_HZ = (hz: number): string => {
  if (hz <= 4)  return 'Delta';
  if (hz <= 8)  return 'Theta';
  if (hz <= 14) return 'Alpha';
  if (hz <= 30) return 'Beta';
  return 'Gamma';
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function noiseBuffer(ctx: AudioContext, secs = 4) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * secs, ctx.sampleRate);
  const d   = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function createReverb(ctx: AudioContext, decay = 2.5) {
  const len = ctx.sampleRate * decay;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
  }
  const conv = ctx.createConvolver();
  conv.buffer = buf;
  return conv;
}

// ── Layer builders ────────────────────────────────────────────────────────────

function buildBinaural(ctx: AudioContext, dst: AudioNode, hz: number, carrier: number) {
  const nodes  = [];
  const merger = ctx.createChannelMerger(2);
  merger.connect(dst);

  const left  = ctx.createOscillator(); left.type  = 'sine'; left.frequency.value  = carrier;
  const right = ctx.createOscillator(); right.type = 'sine'; right.frequency.value = carrier + hz;
  const lg = ctx.createGain(); lg.gain.value = 0.45;
  const rg = ctx.createGain(); rg.gain.value = 0.45;

  const noiseGain   = ctx.createGain();    noiseGain.gain.value = 0.03;
  const noiseFilter = ctx.createBiquadFilter(); noiseFilter.type = 'lowpass'; noiseFilter.frequency.value = 400;
  const noiseSrc    = ctx.createBufferSource(); noiseSrc.buffer = noiseBuffer(ctx, 6); noiseSrc.loop = true;
  noiseSrc.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(dst);
  noiseSrc.start(); nodes.push(noiseSrc);

  left.connect(lg);  lg.connect(merger, 0, 0);
  right.connect(rg); rg.connect(merger, 0, 1);
  left.start(); right.start(); nodes.push(left, right);
  return { nodes, leftOsc: left, rightOsc: right };
}

function buildDrone(ctx: AudioContext, dst: AudioNode, type: string) {
  const nodes: AudioNode[] = [];
  const timers: ReturnType<typeof setInterval>[] = [];
  const master = ctx.createGain(); master.gain.value = 0.85; master.connect(dst);

  if (type === 'tanpura') {
    const STRINGS = [
      { freq: 130.81, period: 3.2, gain: 0.45 },
      { freq: 196.00, period: 2.4, gain: 0.35 },
      { freq: 261.63, period: 2.8, gain: 0.30 },
      { freq: 523.25, period: 3.6, gain: 0.25 },
    ];
    STRINGS.forEach(({ freq, period, gain: g }, idx) => {
      const strike = () => {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const og  = ctx.createGain();
        const c1  = ctx.createOscillator();
        const c2  = ctx.createOscillator();
        const cg  = ctx.createGain();
        osc.type = 'sawtooth'; osc.frequency.value = freq;
        c1.type  = 'sine';    c1.frequency.value   = freq * 1.0015;
        c2.type  = 'sine';    c2.frequency.value   = freq * 0.9985;
        cg.gain.value = g * 0.3;
        og.gain.setValueAtTime(0, now);
        og.gain.linearRampToValueAtTime(g, now + 0.04);
        og.gain.exponentialRampToValueAtTime(0.001, now + period * 0.9);
        const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = freq * 4;
        osc.connect(filt); c1.connect(cg); c2.connect(cg); cg.connect(og);
        filt.connect(og); og.connect(master);
        osc.start(now); c1.start(now); c2.start(now);
        osc.stop(now + period); c1.stop(now + period); c2.stop(now + period);
        nodes.push(osc, c1, c2);
      };
      const t = setInterval(strike, period * 1000);
      setTimeout(strike, idx * 400);
      timers.push(t);
    });

  } else if (type === 'shruti') {
    const lfo  = ctx.createOscillator(); lfo.frequency.value = 4.8; lfo.type = 'sine';
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.012;
    lfo.connect(lfoG); lfoG.connect(master.gain); lfo.start(); nodes.push(lfo);
    [130.81, 164.81, 196.00, 261.63, 329.63].forEach((freq, i) => {
      const osc = ctx.createOscillator(); const og = ctx.createGain();
      osc.type = i < 2 ? 'sawtooth' : 'triangle'; osc.frequency.value = freq;
      osc.detune.value = (i % 2 === 0 ? 1 : -1) * i * 3;
      og.gain.value = 0.28 / (i * 0.5 + 1);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq * 3.5;
      osc.connect(f); f.connect(og); og.connect(master); osc.start(); nodes.push(osc);
    });

  } else if (type === 'bowl') {
    const OVERTONES = [
      { ratio: 1,    gain: 0.50, decay: 6.0 },
      { ratio: 2.76, gain: 0.30, decay: 4.5 },
      { ratio: 5.4,  gain: 0.18, decay: 3.0 },
      { ratio: 10.5, gain: 0.08, decay: 2.0 },
    ];
    const strike = () => {
      const now = ctx.currentTime;
      OVERTONES.forEach(({ ratio, gain: g, decay }) => {
        const osc = ctx.createOscillator(); const og = ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = 220 * ratio;
        og.gain.setValueAtTime(0, now);
        og.gain.linearRampToValueAtTime(g, now + 0.01);
        og.gain.exponentialRampToValueAtTime(0.001, now + decay);
        osc.connect(og); og.connect(master);
        osc.start(now); osc.stop(now + decay + 0.1); nodes.push(osc);
      });
    };
    strike();
    const t = setInterval(strike, 7000); timers.push(t);

  } else if (type === 'om') {
    const lfo  = ctx.createOscillator(); lfo.frequency.value = 0.12; lfo.type = 'sine';
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.08;
    lfo.connect(lfoG); lfoG.connect(master.gain); lfo.start(); nodes.push(lfo);
    [1, 2, 3, 4, 6].forEach((h, i) => {
      const osc = ctx.createOscillator(); const og = ctx.createGain();
      const f   = ctx.createBiquadFilter(); f.type = 'bandpass';
      f.frequency.value = [250,700,2700,3500,4000][i] || 1000; f.Q.value = 8;
      osc.type = 'sawtooth'; osc.frequency.value = 98 * h; og.gain.value = 0.35 / (i + 1);
      osc.connect(f); f.connect(og); og.connect(master); osc.start(); nodes.push(osc);
    });
  }

  return { nodes, timers };
}

function buildInstrument(ctx: AudioContext, dst: AudioNode, type: string, phraseEngine: PhraseEngine) {
  const nodes: AudioNode[] = [];
  const timers: ReturnType<typeof setInterval>[] = [];
  const g      = ctx.createGain(); g.gain.value = 0.9; g.connect(dst);

  if (type === 'bansuri') {
    const breathG = ctx.createGain(); breathG.gain.value = 0.04;
    const breathF = ctx.createBiquadFilter(); breathF.type = 'bandpass'; breathF.frequency.value = 1200; breathF.Q.value = 0.5;
    const bSrc    = ctx.createBufferSource(); bSrc.buffer = noiseBuffer(ctx, 5); bSrc.loop = true;
    bSrc.connect(breathF); breathF.connect(breathG); breathG.connect(g); bSrc.start(); nodes.push(bSrc);

    const playPhrase = () => {
      const phrase = phraseEngine.nextPhrase(6);
      const beat   = phraseEngine.beatSeconds();
      let t = ctx.currentTime + 0.05;
      phrase.forEach(({ freq, duration, rest }) => {
        if (!rest) {
          const osc  = ctx.createOscillator(); const og = ctx.createGain();
          const vLFO = ctx.createOscillator(); const vG  = ctx.createGain();
          osc.type = 'sine'; osc.frequency.value = freq;
          vLFO.frequency.value = 5.5; vLFO.type = 'sine'; vG.gain.value = freq * 0.008;
          vLFO.connect(vG); vG.connect(osc.frequency);
          og.gain.setValueAtTime(0, t);
          og.gain.linearRampToValueAtTime(0.35, t + 0.05);
          og.gain.setValueAtTime(0.35, t + beat * duration - 0.08);
          og.gain.linearRampToValueAtTime(0, t + beat * duration);
          osc.connect(og); og.connect(g);
          osc.start(t); vLFO.start(t);
          osc.stop(t + beat * duration + 0.1); vLFO.stop(t + beat * duration + 0.1);
          nodes.push(osc, vLFO);
        }
        t += beat * duration;
      });
    };
    playPhrase();
    const dur = phraseEngine.nextPhrase(6).reduce((s, n) => s + n.duration, 0) * phraseEngine.beatSeconds() * 1000 + 300;
    timers.push(setInterval(playPhrase, dur));

  } else if (type === 'sitar') {
    const playNote = (freq: number, when: number, dur: number) => {
      const bufLen = Math.round(ctx.sampleRate / freq);
      const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d      = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource(); const lp = ctx.createBiquadFilter(); const og = ctx.createGain();
      src.buffer = buf; src.loop = true;
      lp.type = 'lowpass'; lp.frequency.value = freq * 4; lp.Q.value = 2;
      og.gain.setValueAtTime(0.4, when); og.gain.exponentialRampToValueAtTime(0.001, when + dur);
      src.connect(lp); lp.connect(og); og.connect(g);
      src.start(when); src.stop(when + dur + 0.1); nodes.push(src);
      [2,3,4,5].forEach(h => {
        const sOsc = ctx.createOscillator(); const sOg = ctx.createGain();
        sOsc.type = 'sine'; sOsc.frequency.value = freq * h;
        sOg.gain.setValueAtTime(0.025/h, when); sOg.gain.exponentialRampToValueAtTime(0.001, when + dur*0.6);
        sOsc.connect(sOg); sOg.connect(g); sOsc.start(when); sOsc.stop(when + dur*0.7); nodes.push(sOsc);
      });
    };
    const playPhrase = () => {
      const phrase = phraseEngine.nextPhrase(5); const beat = phraseEngine.beatSeconds();
      let t = ctx.currentTime + 0.1;
      phrase.forEach(({ freq, duration, rest }) => { if (!rest) playNote(freq, t, beat*duration*0.9); t += beat*duration; });
    };
    playPhrase();
    timers.push(setInterval(playPhrase, phraseEngine.beatSeconds() * 10 * 1000));

  } else if (type === 'tabla') {
    const TAAL   = [1,0,0,1, 1,0,1,0, 1,0,0,1, 1,0,1,1];
    const BAYAN  = new Set([0,8]);
    const beat   = phraseEngine.beatSeconds() * 0.5;
    const playB  = (when: number) => {
      const osc = ctx.createOscillator(); const og = ctx.createGain();
      const lp  = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=120;
      osc.type='sine'; osc.frequency.setValueAtTime(80,when); osc.frequency.exponentialRampToValueAtTime(45,when+0.08);
      og.gain.setValueAtTime(0.5,when); og.gain.exponentialRampToValueAtTime(0.001,when+0.18);
      osc.connect(lp); lp.connect(og); og.connect(g); osc.start(when); osc.stop(when+0.2); nodes.push(osc);
    };
    const playD  = (when: number) => {
      const osc = ctx.createOscillator(); const og = ctx.createGain();
      osc.type='sine'; osc.frequency.setValueAtTime(310,when); osc.frequency.exponentialRampToValueAtTime(240,when+0.04);
      og.gain.setValueAtTime(0.38,when); og.gain.exponentialRampToValueAtTime(0.001,when+0.12);
      osc.connect(og); og.connect(g); osc.start(when); osc.stop(when+0.14); nodes.push(osc);
    };
    const playPattern = () => {
      let t = ctx.currentTime + 0.05;
      TAAL.forEach((hit, i) => { if (BAYAN.has(i)) playB(t); else if (hit) playD(t); t += beat; });
    };
    playPattern();
    timers.push(setInterval(playPattern, beat * 16 * 1000));

  } else if (type === 'sarod') {
    const playNote = (freq: number, when: number, dur: number) => {
      const osc = ctx.createOscillator(); const bpf = ctx.createBiquadFilter(); const og = ctx.createGain();
      osc.type = 'sawtooth'; osc.frequency.value = freq;
      bpf.type = 'bandpass'; bpf.frequency.value = freq * 1.8; bpf.Q.value = 35;
      og.gain.setValueAtTime(0, when); og.gain.linearRampToValueAtTime(0.30, when+0.02);
      og.gain.exponentialRampToValueAtTime(0.001, when+dur);
      osc.connect(bpf); bpf.connect(og); og.connect(g); osc.start(when); osc.stop(when+dur+0.05); nodes.push(osc);
    };
    const playPhrase = () => {
      const phrase = phraseEngine.nextPhrase(7); const beat = phraseEngine.beatSeconds();
      let t = ctx.currentTime + 0.1;
      phrase.forEach(({ freq, duration, rest }) => { if (!rest) playNote(freq, t, beat*duration*0.85); t += beat*duration; });
    };
    playPhrase();
    timers.push(setInterval(playPhrase, phraseEngine.beatSeconds() * 12 * 1000));
  }

  return { nodes, timers };
}

function buildNature(ctx: AudioContext, dst: AudioNode, type: string) {
  const nodes: AudioNode[] = [];
  const timers: ReturnType<typeof setTimeout>[] = [];
  const g      = ctx.createGain(); g.gain.value = 0.9; g.connect(dst);

  if (type === 'rain') {
    [{ f:600,Q:0.8,g:0.35,l:0.18 },{ f:1200,Q:1.0,g:0.28,l:0.27 },{ f:2500,Q:0.7,g:0.22,l:0.13 },{ f:4000,Q:1.2,g:0.15,l:0.22 }]
      .forEach(({ f, Q, g: bG, l }) => {
        const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx,5); src.loop=true;
        const bp  = ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=f; bp.Q.value=Q;
        const og  = ctx.createGain(); og.gain.value=bG;
        const lfo = ctx.createOscillator(); lfo.frequency.value=l; lfo.type='sine';
        const lg  = ctx.createGain(); lg.gain.value=bG*0.3;
        lfo.connect(lg); lg.connect(og.gain);
        src.connect(bp); bp.connect(og); og.connect(g);
        src.start(); lfo.start(); nodes.push(src, lfo);
      });

  } else if (type === 'ocean') {
    const lp   = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=250;
    const bp   = ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=700; bp.Q.value=0.5;
    const s1   = ctx.createBufferSource(); s1.buffer=noiseBuffer(ctx,6); s1.loop=true;
    const s2   = ctx.createBufferSource(); s2.buffer=noiseBuffer(ctx,6); s2.loop=true;
    const g1   = ctx.createGain(); g1.gain.value=0.45;
    const g2   = ctx.createGain(); g2.gain.value=0.30;
    const wLFO = ctx.createOscillator(); wLFO.frequency.value=0.07; wLFO.type='sine';
    const wG   = ctx.createGain(); wG.gain.value=0.25;
    wLFO.connect(wG); wG.connect(g.gain); wLFO.start(); nodes.push(wLFO);
    s1.connect(lp); lp.connect(g1); g1.connect(g);
    s2.connect(bp); bp.connect(g2); g2.connect(g);
    s1.start(); s2.start(); nodes.push(s1,s2);

  } else if (type === 'river') {
    const src = ctx.createBufferSource(); src.buffer=noiseBuffer(ctx,5); src.loop=true;
    const bp1 = ctx.createBiquadFilter(); bp1.type='bandpass'; bp1.frequency.value=900;  bp1.Q.value=0.6;
    const bp2 = ctx.createBiquadFilter(); bp2.type='bandpass'; bp2.frequency.value=1800; bp2.Q.value=0.8;
    const og  = ctx.createGain(); og.gain.value=0.5;
    const lfo = ctx.createOscillator(); lfo.frequency.value=0.15; lfo.type='sine';
    const lg  = ctx.createGain(); lg.gain.value=200;
    lfo.connect(lg); lg.connect(bp1.frequency);
    src.connect(bp1); bp1.connect(bp2); bp2.connect(og); og.connect(g);
    src.start(); lfo.start(); nodes.push(src,lfo);

  } else if (type === 'wind') {
    const src  = ctx.createBufferSource(); src.buffer=noiseBuffer(ctx,6); src.loop=true;
    const lp   = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=500;
    const og   = ctx.createGain(); og.gain.value=0.55;
    const lfo  = ctx.createOscillator(); lfo.frequency.value=0.02; lfo.type='sine';
    const lfoG = ctx.createGain(); lfoG.gain.value=300;
    lfo.connect(lfoG); lfoG.connect(lp.frequency);
    src.connect(lp); lp.connect(og); og.connect(g);
    src.start(); lfo.start(); nodes.push(src,lfo);

  } else if (type === 'forest') {
    const wSrc = ctx.createBufferSource(); wSrc.buffer=noiseBuffer(ctx,6); wSrc.loop=true;
    const wLp  = ctx.createBiquadFilter(); wLp.type='lowpass'; wLp.frequency.value=400;
    const wG   = ctx.createGain(); wG.gain.value=0.22;
    wSrc.connect(wLp); wLp.connect(wG); wG.connect(g); wSrc.start(); nodes.push(wSrc);

    const scheduleChirp = () => {
      const t = setTimeout(() => {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator(); const og = ctx.createGain();
        const f1  = 1800 + Math.random() * 1200;
        osc.type='sine'; osc.frequency.setValueAtTime(f1,now); osc.frequency.linearRampToValueAtTime(f1*1.4,now+0.18);
        og.gain.setValueAtTime(0,now); og.gain.linearRampToValueAtTime(0.18,now+0.04); og.gain.linearRampToValueAtTime(0,now+0.22);
        osc.connect(og); og.connect(g); osc.start(now); osc.stop(now+0.25); nodes.push(osc);
        scheduleChirp();
      }, (6 + Math.random() * 10) * 1000);
      timers.push(t);
    };
    scheduleChirp();
  }

  return { nodes, timers };
}

function buildSolfeggio(ctx: AudioContext, dst: AudioNode, hz: number) {
  const nodes: AudioNode[]   = [];
  const conv    = createReverb(ctx, 3);
  const dryG    = ctx.createGain(); dryG.gain.value = 0.7;
  const wetG    = ctx.createGain(); wetG.gain.value = 0.3;
  conv.connect(wetG); wetG.connect(dst); dryG.connect(dst);

  [hz, hz*2, hz*3].forEach((f, i) => {
    const osc = ctx.createOscillator(); const og = ctx.createGain();
    const c1  = ctx.createOscillator(); const c2 = ctx.createOscillator(); const cg = ctx.createGain();
    osc.type='sine'; osc.frequency.value=f;
    c1.type='sine'; c1.frequency.value=f*1.003;
    c2.type='sine'; c2.frequency.value=f*0.997;
    cg.gain.value=0.08; og.gain.value=0.35/(i+1);
    c1.connect(cg); c2.connect(cg); cg.connect(og);
    osc.connect(og); og.connect(dryG); og.connect(conv);
    osc.start(); c1.start(); c2.start(); nodes.push(osc,c1,c2);
  });

  return { nodes, timers: [] };
}

// ── Default state ─────────────────────────────────────────────────────────────
const DEFAULT_LAYERS = {
  binaural:   { volume: 0.7, pan: 0, mute: false, solo: false, eq: { bass:0, mid:0, treble:0 }, reverb: 0.10, active: true  },
  drone:      { volume: 0.5, pan: 0, mute: false, solo: false, eq: { bass:0, mid:0, treble:0 }, reverb: 0.20, active: false },
  instrument: { volume: 0.4, pan: 0, mute: false, solo: false, eq: { bass:0, mid:0, treble:0 }, reverb: 0.30, active: false },
  nature:     { volume: 0.5, pan: 0, mute: false, solo: false, eq: { bass:0, mid:0, treble:0 }, reverb: 0.15, active: false },
  solfeggio:  { volume: 0.3, pan: 0, mute: false, solo: false, eq: { bass:0, mid:0, treble:0 }, reverb: 0.40, active: false },
};

const DEFAULT_SETTINGS = {
  binaural:   { hz: 6, carrierHz: 200 },
  drone:      { type: 'tanpura' },
  instrument: { type: 'bansuri' },
  nature:     { type: 'rain' },
  solfeggio:  { hz: 528 },
};

// ── Context type ─────────────────────────────────────────────────────────────
export interface SoundEngineContextType {
  isPlaying: boolean;
  layers: typeof DEFAULT_LAYERS;
  settings: typeof DEFAULT_SETTINGS;
  intention: string | null;
  elapsed: number;
  bpm: number;
  chaos: number;
  masterVol: number;
  brainwave: string;
  analyser: AnalyserNode | null;
  start: () => void;
  stop: () => void;
  togglePlay: () => void;
  setLayerVolume: (name: string, vol: number) => void;
  setLayerPan: (name: string, pan: number) => void;
  toggleMute: (name: string) => void;
  toggleSolo: (name: string) => void;
  setLayerEQ: (name: string, band: string, value: number) => void;
  setLayerReverb: (name: string, val: number) => void;
  setLayerActive: (name: string, active: boolean) => void;
  updateLayerSetting: (layer: string, key: string, value: unknown) => void;
  applyIntention: (key: string) => void;
  applyMix: (mixData: Record<string, unknown>) => void;
  setBpm: (val: number) => void;
  setChaos: (val: number) => void;
  setMasterVolume: (val: number) => void;
  adaptFromHeartRate: (hr: number) => void;
  ragaName: string;
}

const SoundEngineContext = createContext<SoundEngineContextType | null>(null);

export function SoundEngineProvider({ children }: { children: ReactNode }) {
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [layers,       setLayers]       = useState(DEFAULT_LAYERS);
  const [settings,     setSettings]     = useState(DEFAULT_SETTINGS);
  const [intention,    setIntention]    = useState<string | null>(null);
  const [elapsed,      setElapsed]      = useState(0);
  const [bpm,          setBpmState]     = useState(60);
  const [chaos,        setChaosState]   = useState(0.3);
  const [masterVol,    setMasterVol]    = useState(0.85);
  const [masterReverb, setMasterReverb] = useState(0.15);

  const ctxRef          = useRef<AudioContext | null>(null);
  const nodesRef        = useRef<Record<string, { nodes: AudioNode[]; timers: ReturnType<typeof setInterval>[]; leftOsc?: OscillatorNode; rightOsc?: OscillatorNode }>>({});
  const gainNodesRef    = useRef<Record<string, GainNode>>({});
  const panNodesRef     = useRef<Record<string, StereoPannerNode>>({});
  const eqNodesRef      = useRef<Record<string, { bassEQ: BiquadFilterNode; midEQ: BiquadFilterNode; trebleEQ: BiquadFilterNode }>>({});
  const reverbSendRef   = useRef<Record<string, GainNode>>({});
  const masterGainRef   = useRef<GainNode | null>(null);
  const masterRevRef    = useRef<ConvolverNode | null>(null);
  const analyserRef     = useRef<AnalyserNode | null>(null);
  const phraseRef       = useRef(new PhraseEngine('meditate', 0.3));
  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const settingsRef     = useRef(DEFAULT_SETTINGS);
  const layersRef       = useRef(DEFAULT_LAYERS);

  // Keep refs in sync for use inside callbacks without stale closures
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { layersRef.current   = layers;   }, [layers]);

  const brainwave = BW_FOR_HZ(settings.binaural.hz);

  // ── Build one layer into ctx ────────────────────────────────────────────────
  const buildLayer = useCallback((ctx: AudioContext, name: string, masterIn: AudioNode) => {
    const s = settingsRef.current;
    const l = (layersRef.current as Record<string, typeof DEFAULT_LAYERS['binaural']>)[name];

    const gainNode = ctx.createGain();
    const panNode  = ctx.createStereoPanner();
    const bassEQ   = ctx.createBiquadFilter(); bassEQ.type   = 'lowshelf';  bassEQ.frequency.value = 80;   bassEQ.gain.value = l.eq.bass;
    const midEQ    = ctx.createBiquadFilter(); midEQ.type    = 'peaking';   midEQ.frequency.value  = 800;  midEQ.gain.value  = l.eq.mid;  midEQ.Q.value = 1;
    const trebleEQ = ctx.createBiquadFilter(); trebleEQ.type = 'highshelf'; trebleEQ.frequency.value = 8000; trebleEQ.gain.value = l.eq.treble;
    const revSend  = ctx.createGain(); revSend.gain.value  = l.reverb;
    const dryGain  = ctx.createGain(); dryGain.gain.value  = 1 - l.reverb * 0.5;

    bassEQ.connect(midEQ); midEQ.connect(trebleEQ); trebleEQ.connect(gainNode);
    gainNode.connect(panNode);
    panNode.connect(dryGain);   dryGain.connect(masterIn);
    if (masterRevRef.current) panNode.connect(revSend); revSend.connect(masterRevRef.current!);

    gainNode.gain.value = l.mute ? 0 : l.volume;
    panNode.pan.value   = l.pan;

    gainNodesRef.current[name]  = gainNode;
    panNodesRef.current[name]   = panNode;
    eqNodesRef.current[name]    = { bassEQ, midEQ, trebleEQ };
    reverbSendRef.current[name] = revSend;

    let result;
    if (name === 'binaural')   result = buildBinaural(ctx,   bassEQ, s.binaural.hz, s.binaural.carrierHz);
    if (name === 'drone')      result = buildDrone(ctx,      bassEQ, s.drone.type);
    if (name === 'instrument') result = buildInstrument(ctx, bassEQ, s.instrument.type, phraseRef.current);
    if (name === 'nature')     result = buildNature(ctx,     bassEQ, s.nature.type);
    if (name === 'solfeggio')  result = buildSolfeggio(ctx,  bassEQ, s.solfeggio.hz);
    if (result) nodesRef.current[name] = result as { nodes: AudioNode[]; timers: ReturnType<typeof setInterval>[] };
  }, []);

  const stopLayer = useCallback((name: string) => {
    const { nodes = [], timers = [] } = nodesRef.current[name] || {};
    timers.forEach(t => { clearInterval(t); clearTimeout(t); });
    nodes.forEach(n => { try { (n as AudioScheduledSourceNode).stop?.(); n.disconnect?.(); } catch {} });
    gainNodesRef.current[name]?.disconnect?.();
    panNodesRef.current[name]?.disconnect?.();
    delete nodesRef.current[name];
    delete gainNodesRef.current[name];
    delete panNodesRef.current[name];
  }, []);

  // ── Start ───────────────────────────────────────────────────────────────────
  const start = useCallback(() => {
    if (ctxRef.current) { try { ctxRef.current.close(); } catch {} }
    const AudioCtx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const ctx      = new AudioCtx();
    ctxRef.current = ctx;

    const masterGain = ctx.createGain(); masterGain.gain.value = masterVol;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value=-24; comp.knee.value=10; comp.ratio.value=4; comp.attack.value=0.003; comp.release.value=0.25;
    const analyser = ctx.createAnalyser(); analyser.fftSize = 256;
    const reverb   = createReverb(ctx, 2.8);
    const revGain  = ctx.createGain(); revGain.gain.value = masterReverb;

    masterGain.connect(comp); comp.connect(analyser); analyser.connect(ctx.destination);
    reverb.connect(revGain); revGain.connect(analyser);

    masterGainRef.current = masterGain;
    masterRevRef.current  = reverb;
    analyserRef.current   = analyser;

    const toBuild = new Set(['binaural']);
    Object.entries(layersRef.current).forEach(([name, l]) => { if (l.active) toBuild.add(name); });
    toBuild.forEach(name => buildLayer(ctx, name, masterGain));

    setIsPlaying(true);
    setElapsed(0);
    if (timerRef.current !== null) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }, [masterVol, masterReverb, buildLayer]);

  // ── Stop ────────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    if (timerRef.current !== null) clearInterval(timerRef.current);
    Object.keys(nodesRef.current).forEach(stopLayer);
    nodesRef.current = {}; gainNodesRef.current = {}; panNodesRef.current = {};
    eqNodesRef.current = {}; reverbSendRef.current = {};
    try { ctxRef.current?.close(); } catch {}
    ctxRef.current = null;
    setIsPlaying(false);
  }, [stopLayer]);

  const togglePlay = useCallback(() => { isPlaying ? stop() : start(); }, [isPlaying, start, stop]);

  // ── Layer controls ──────────────────────────────────────────────────────────
  const setLayerVolume = useCallback((name: string, vol: number) => {
    setLayers(prev => {
      const prevL = prev as Record<string, typeof DEFAULT_LAYERS['binaural']>;
      const next    = { ...prev, [name]: { ...prevL[name], volume: vol } } as Record<string, typeof DEFAULT_LAYERS['binaural']>;
      const gn      = gainNodesRef.current[name];
      const anySolo = Object.values(next).some(l => l.solo);
      if (gn && ctxRef.current) {
        const hearable = !next[name].mute && (!anySolo || next[name].solo);
        gn.gain.setTargetAtTime(hearable ? vol : 0, ctxRef.current.currentTime, 0.02);
      }
      return next as unknown as typeof DEFAULT_LAYERS;
    });
  }, []);

  const setLayerPan = useCallback((name: string, pan: number) => {
    setLayers(prev => {
      const pn = panNodesRef.current[name];
      if (pn && ctxRef.current) pn.pan.setTargetAtTime(pan, ctxRef.current.currentTime, 0.02);
      return { ...prev, [name]: { ...(prev as Record<string, typeof DEFAULT_LAYERS['binaural']>)[name], pan } } as typeof DEFAULT_LAYERS;
    });
  }, []);

  const toggleMute = useCallback((name: string) => {
    setLayers(prev => {
      const mute    = !(prev as Record<string, typeof DEFAULT_LAYERS['binaural']>)[name].mute;
      const next    = { ...prev, [name]: { ...(prev as Record<string, typeof DEFAULT_LAYERS['binaural']>)[name], mute } };
      const gn      = gainNodesRef.current[name];
      const nextL = next as Record<string, typeof DEFAULT_LAYERS['binaural']>;
      const anySolo = Object.values(nextL).some(l => l.solo);
      if (gn && ctxRef.current) {
        const hearable = !mute && (!anySolo || nextL[name].solo);
        gn.gain.setTargetAtTime(hearable ? nextL[name].volume : 0, ctxRef.current.currentTime, 0.02);
      }
      return next as typeof DEFAULT_LAYERS;
    });
  }, []);

  const toggleSolo = useCallback((name: string) => {
    setLayers(prev => {
      const prevL = prev as Record<string, typeof DEFAULT_LAYERS['binaural']>;
      const solo    = !prevL[name].solo;
      const next    = { ...prev, [name]: { ...prevL[name], solo } };
      const anySolo = Object.values(next).some(l => l.solo);
      Object.entries(next).forEach(([n, l]) => {
        const gn = gainNodesRef.current[n];
        if (gn && ctxRef.current) {
          const hearable = !l.mute && (!anySolo || l.solo);
          gn.gain.setTargetAtTime(hearable ? l.volume : 0, ctxRef.current.currentTime, 0.02);
        }
      });
      return next as typeof DEFAULT_LAYERS;
    });
  }, []);

  const setLayerEQ = useCallback((name: string, band: string, value: number) => {
    setLayers(prev => {
      const prevL = prev as Record<string, typeof DEFAULT_LAYERS['binaural']>;
      const eq = eqNodesRef.current[name];
      if (eq && ctxRef.current) {
        const t = ctxRef.current.currentTime;
        if (band === 'bass')   eq.bassEQ.gain.setTargetAtTime(value, t, 0.05);
        if (band === 'mid')    eq.midEQ.gain.setTargetAtTime(value,  t, 0.05);
        if (band === 'treble') eq.trebleEQ.gain.setTargetAtTime(value, t, 0.05);
      }
      return { ...prev, [name]: { ...prevL[name], eq: { ...prevL[name].eq, [band]: value } } } as typeof DEFAULT_LAYERS;
    });
  }, []);

  const setLayerReverb = useCallback((name: string, val: number) => {
    setLayers(prev => {
      const prevL = prev as Record<string, typeof DEFAULT_LAYERS['binaural']>;
      const rs = reverbSendRef.current[name];
      if (rs && ctxRef.current) rs.gain.setTargetAtTime(val, ctxRef.current.currentTime, 0.05);
      return { ...prev, [name]: { ...prevL[name], reverb: val } } as typeof DEFAULT_LAYERS;
    });
  }, []);

  const setLayerActive = useCallback((name: string, active: boolean) => {
    setLayers(prev => {
      const prevL = prev as Record<string, typeof DEFAULT_LAYERS['binaural']>;
      return { ...prev, [name]: { ...prevL[name], active } } as typeof DEFAULT_LAYERS;
    });
    if (!isPlaying || !ctxRef.current) return;
    if (active && !nodesRef.current[name]) {
      buildLayer(ctxRef.current, name, masterGainRef.current!);
    } else if (!active) {
      stopLayer(name);
    }
  }, [isPlaying, buildLayer, stopLayer]);

  const updateLayerSetting = useCallback((layer: string, key: string, value: unknown) => {
    setSettings(prev => {
      const next = { ...prev, [layer]: { ...(prev as Record<string, Record<string, unknown>>)[layer], [key]: value } };
      settingsRef.current = next as typeof DEFAULT_SETTINGS;
      return next as typeof DEFAULT_SETTINGS;
    });
    if (isPlaying && ctxRef.current) {
      stopLayer(layer);
      setTimeout(() => {
        if (ctxRef.current && masterGainRef.current) buildLayer(ctxRef.current, layer, masterGainRef.current);
      }, 60);
    }
  }, [isPlaying, buildLayer, stopLayer]);

  const applyIntention = useCallback((key: string) => {
    const preset = (INTENTIONS as unknown as Record<string, typeof INTENTIONS['sleep']>)[key];
    if (!preset) return;
    setIntention(key);
    phraseRef.current.setIntention(key, phraseRef.current.chaos);
    setBpmState(phraseRef.current.getBpm());

    const newSettings = {
      binaural:   { hz: preset.binauralHz, carrierHz: preset.carrierHz },
      drone:      { type: preset.drone      || settingsRef.current.drone.type },
      instrument: { type: preset.instrument || settingsRef.current.instrument.type },
      nature:     { type: preset.nature     || settingsRef.current.nature.type },
      solfeggio:  { hz: preset.solfeggio },
    };
    setSettings(newSettings);
    settingsRef.current = newSettings;

    setLayers(prev => ({
      ...prev,
      binaural:   { ...prev.binaural,   active: true },
      drone:      { ...prev.drone,      active: !!preset.drone },
      instrument: { ...prev.instrument, active: !!preset.instrument },
      nature:     { ...prev.nature,     active: !!preset.nature },
      solfeggio:  { ...prev.solfeggio,  active: true },
    }));

    if (isPlaying) { stop(); setTimeout(start, 120); }
  }, [isPlaying, stop, start]);

  const applyMix = useCallback((mixData: Record<string, unknown>) => {
    if (mixData.settings) { setSettings(s => ({ ...s, ...(mixData.settings as Record<string, unknown>) } as typeof DEFAULT_SETTINGS)); settingsRef.current = { ...settingsRef.current, ...(mixData.settings as Record<string, unknown>) } as typeof DEFAULT_SETTINGS; }
    if (mixData.layers)   setLayers(l  => ({ ...l,  ...(mixData.layers  as Record<string, unknown>) } as typeof DEFAULT_LAYERS));
    if (mixData.bpm)      setBpmState(mixData.bpm as number);
    if (mixData.chaos !== undefined) setChaosState(mixData.chaos as number);
    if (mixData.intention) setIntention(mixData.intention as string);
    if (isPlaying) { stop(); setTimeout(start, 150); }
  }, [isPlaying, stop, start]);

  const setBpm = useCallback((val: number) => { setBpmState(val); phraseRef.current.setBpm(val); }, []);
  const setChaos = useCallback((val: number) => { setChaosState(val); phraseRef.current.setChaos(val); }, []);

  const setMasterVolume = useCallback((val: number) => {
    setMasterVol(val);
    if (masterGainRef.current && ctxRef.current) masterGainRef.current.gain.setTargetAtTime(val, ctxRef.current.currentTime, 0.05);
  }, []);

  const adaptFromHeartRate = useCallback((hr: number) => {
    if (!ctxRef.current) return;
    const { leftOsc, rightOsc } = nodesRef.current.binaural || {};
    if (!leftOsc || !rightOsc) return;
    const curHz = settingsRef.current.binaural.hz;
    const targetHz = hr > 90 ? Math.max(2, curHz - 1) : hr < 60 ? Math.min(40, curHz + 1) : curHz;
    const carrier  = settingsRef.current.binaural.carrierHz;
    const t        = ctxRef.current.currentTime;
    leftOsc.frequency.setTargetAtTime(carrier,             t, 2);
    rightOsc.frequency.setTargetAtTime(carrier + targetHz, t, 2);
  }, []);

  useEffect(() => () => stop(), []);

  const value = React.useMemo(() => ({
    isPlaying, layers, settings, intention, elapsed, bpm, chaos, masterVol,
    brainwave, analyser: analyserRef.current,
    start, stop, togglePlay,
    setLayerVolume, setLayerPan, toggleMute, toggleSolo,
    setLayerEQ, setLayerReverb, setLayerActive,
    updateLayerSetting, applyIntention, applyMix,
    setBpm, setChaos, setMasterVolume,
    adaptFromHeartRate,
    ragaName: phraseRef.current.getRagaName(),
  }), [
    isPlaying, layers, settings, intention, elapsed, bpm, chaos, masterVol,
    brainwave, start, stop, togglePlay,
    setLayerVolume, setLayerPan, toggleMute, toggleSolo,
    setLayerEQ, setLayerReverb, setLayerActive,
    updateLayerSetting, applyIntention, applyMix,
    setBpm, setChaos, setMasterVolume, adaptFromHeartRate,
  ]);

  return <SoundEngineContext.Provider value={value}>{children}</SoundEngineContext.Provider>;
}

export function useSoundEngine(): SoundEngineContextType {
  const ctx = useContext(SoundEngineContext);
  if (!ctx) throw new Error('useSoundEngine must be used inside SoundEngineProvider');
  return ctx;
}
