// Generative melodic phrase engine — ragas mapped to intentions

const RAGAS: Record<string, { name: string; scale: number[]; root: number; bpm: number }> = {
  sleep:    { name: 'Bhairavi',  scale: [0,2,3,5,7,8,10], root: 130.81, bpm: 44 },
  focus:    { name: 'Yaman',     scale: [0,2,4,6,7,9,11], root: 146.83, bpm: 66 },
  heal:     { name: 'Darbari',   scale: [0,2,3,5,7,8,10], root: 123.47, bpm: 54 },
  energize: { name: 'Bhairav',   scale: [0,1,4,5,7,8,11], root: 164.81, bpm: 86 },
  meditate: { name: 'Bhupali',   scale: [0,2,4,7,9],      root: 138.59, bpm: 58 },
  custom:   { name: 'Khamaj',    scale: [0,2,4,5,7,9,10], root: 146.83, bpm: 60 },
};

function midiToFreq(midi: number) { return 440 * Math.pow(2, (midi - 69) / 12); }

function buildScaleFreqs(rootHz: number, intervals: number[], octaves = 3) {
  const freqs: number[] = [];
  const rootMidi = Math.round(69 + 12 * Math.log2(rootHz / 440));
  for (let oct = 0; oct < octaves; oct++) {
    for (const interval of intervals) {
      freqs.push(midiToFreq(rootMidi + oct * 12 + interval));
    }
  }
  return freqs.sort((a, b) => a - b);
}

function pickPhrase(freqs: number[], length: number, chaos = 0.3) {
  const notes: { freq: number; duration: number; rest: boolean }[] = [];
  let idx = Math.floor(freqs.length * 0.2);
  for (let i = 0; i < length; i++) {
    const leap = Math.random() < chaos;
    const step = leap
      ? Math.floor(Math.random() * 4 + 2) * (Math.random() < 0.5 ? 1 : -1)
      : (Math.random() < 0.6 ? 1 : -1);
    idx = Math.max(0, Math.min(freqs.length - 1, idx + step));
    const duration = [0.5, 1, 1, 1.5, 2][Math.floor(Math.random() * 5)];
    const rest = Math.random() < 0.15;
    notes.push({ freq: freqs[idx], duration, rest });
  }
  return notes;
}

export class PhraseEngine {
  raga: { name: string; scale: number[]; root: number; bpm: number };
  freqs: number[];
  chaos: number;
  bpm: number;

  constructor(intention = 'meditate', chaos = 0.3) {
    this.raga  = RAGAS.custom;
    this.freqs = [];
    this.chaos = chaos;
    this.bpm   = 60;
    this.setIntention(intention, chaos);
  }

  setIntention(intention: string, chaos = 0.3) {
    const raga = RAGAS[intention] || RAGAS.custom;
    this.raga  = raga;
    this.freqs = buildScaleFreqs(raga.root, raga.scale, 3);
    this.chaos = chaos;
    this.bpm   = raga.bpm;
  }

  setBpm(bpm: number)   { this.bpm   = bpm; }
  setChaos(c: number)   { this.chaos = c; }

  nextPhrase(length = 8) {
    return pickPhrase(this.freqs, length, this.chaos);
  }

  beatSeconds() { return 60 / this.bpm; }
  getRagaName() { return this.raga.name; }
  getBpm()      { return this.bpm; }
}

export { RAGAS };
