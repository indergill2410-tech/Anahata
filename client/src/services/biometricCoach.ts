export type BiometricSource = 'watch' | 'demo' | 'websocket' | 'manual';

export interface BiometricZone {
  id: 'high' | 'elevated' | 'active' | 'settled' | 'low';
  label: string;
  color: string;
}

export interface BiometricTrend {
  direction: 'warming-up' | 'rising' | 'falling' | 'steady';
  delta: number;
  baseline: number;
  label: string;
}

export interface BreathingRecommendation {
  id: string;
  label: string;
  pattern: string;
  inhale: number;
  hold: number;
  exhale: number;
  rest: number;
  cycles: number;
  durationSeconds: number;
  instruction?: string;
}

export interface MusicRecommendation {
  intention: 'sleep' | 'focus' | 'heal' | 'energize' | 'meditate';
  brainwave: string;
  binauralHz: number;
  carrierHz: number;
  tempo: number;
  layerCue: string;
  reason?: string;
}

export interface BiometricSamplePayload {
  source?: BiometricSource;
  device_name?: string;
  deviceName?: string | null;
  heart_rate?: number | null;
  heartRate?: number | null;
  hrv?: number | null;
  spo2?: number | null;
  stress_level?: string;
  battery?: number | null;
  captured_at?: string;
  capturedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface BiometricSample extends BiometricSamplePayload {
  id?: string;
  user_id?: string;
  source: BiometricSource;
  heart_rate: number;
  device_name?: string;
  captured_at: string;
  created?: string;
  updated?: string;
}

export interface BiometricAdvice {
  generatedAt: string;
  confidence: number;
  summary: string;
  primaryAction: string;
  metrics: {
    heartRate: number;
    hrv: number | null;
    spo2: number | null;
    battery: number | null;
    source: BiometricSource;
    deviceName: string;
    zone: BiometricZone;
    trend: BiometricTrend;
    targetHeartRate: number;
    sampleCount: number;
  };
  breathing: BreathingRecommendation;
  music: MusicRecommendation;
  cautions: string[];
}

export interface BiometricSummary {
  samples: BiometricSample[];
  latestSample: BiometricSample | null;
  latestAdvice: unknown | null;
  advice: BiometricAdvice | null;
}

type AuthFetch = (url: string, options?: RequestInit) => Promise<Response>;

const VALID_SOURCES: BiometricSource[] = ['watch', 'demo', 'websocket', 'manual'];

const BREATHING_LIBRARY = {
  settle: {
    id: 'settle-4-6',
    label: 'Settle breath',
    pattern: '4 in / 6 out',
    inhale: 4,
    hold: 0,
    exhale: 6,
    rest: 0,
    cycles: 8,
    durationSeconds: 80,
  },
  box: {
    id: 'box-4-4-6',
    label: 'Balanced box',
    pattern: '4 in / 4 hold / 6 out',
    inhale: 4,
    hold: 4,
    exhale: 6,
    rest: 0,
    cycles: 6,
    durationSeconds: 84,
  },
  longExhale: {
    id: 'long-exhale-4-2-8',
    label: 'Long exhale reset',
    pattern: '4 in / 2 hold / 8 out',
    inhale: 4,
    hold: 2,
    exhale: 8,
    rest: 0,
    cycles: 6,
    durationSeconds: 84,
  },
  grounding: {
    id: 'grounding-3-2-7',
    label: 'Grounding reset',
    pattern: '3 in / 2 hold / 7 out',
    inhale: 3,
    hold: 2,
    exhale: 7,
    rest: 2,
    cycles: 5,
    durationSeconds: 70,
  },
  gentle: {
    id: 'gentle-4-2-4',
    label: 'Gentle coherence',
    pattern: '4 in / 2 hold / 4 out',
    inhale: 4,
    hold: 2,
    exhale: 4,
    rest: 0,
    cycles: 8,
    durationSeconds: 80,
  },
} satisfies Record<string, BreathingRecommendation>;

const MUSIC_LIBRARY = {
  sleep: { intention: 'sleep', brainwave: 'Delta', binauralHz: 2, carrierHz: 180, tempo: 48, layerCue: 'tanpura, rain, low delta' },
  meditate: { intention: 'meditate', brainwave: 'Theta', binauralHz: 6, carrierHz: 200, tempo: 58, layerCue: 'om drone, sitar, river, theta' },
  heal: { intention: 'heal', brainwave: 'Theta', binauralHz: 7, carrierHz: 210, tempo: 56, layerCue: 'bowls, forest, 396Hz, theta' },
  focus: { intention: 'focus', brainwave: 'Alpha', binauralHz: 10, carrierHz: 220, tempo: 66, layerCue: 'bansuri, shruti, alpha focus' },
  energize: { intention: 'energize', brainwave: 'Beta', binauralHz: 18, carrierHz: 200, tempo: 76, layerCue: 'tabla, shruti, beta clarity' },
} satisfies Record<string, MusicRecommendation>;

function toNumber(value: unknown, fallback: number | null = null) {
  if (value === undefined || value === null || value === '') return fallback;
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeSource(source?: string): BiometricSource {
  const next = String(source || 'manual').toLowerCase() as BiometricSource;
  return VALID_SOURCES.includes(next) ? next : 'manual';
}

function readHeartRate(sample: BiometricSamplePayload) {
  return toNumber(sample.heart_rate ?? sample.heartRate, null);
}

export function normalizeBiometricSample(sample: BiometricSamplePayload): BiometricSample | null {
  const heartRate = readHeartRate(sample);
  if (!heartRate || heartRate < 30 || heartRate > 220) return null;

  const hrv = toNumber(sample.hrv, null);
  const spo2 = toNumber(sample.spo2, null);
  const battery = toNumber(sample.battery, null);

  return {
    ...sample,
    source: normalizeSource(sample.source),
    device_name: String(sample.device_name || sample.deviceName || '').slice(0, 120),
    heart_rate: Math.round(heartRate),
    hrv: hrv === null ? null : clamp(hrv, 0, 300),
    spo2: spo2 === null ? null : clamp(spo2, 50, 100),
    battery: battery === null ? null : clamp(Math.round(battery), 0, 100),
    captured_at: sample.captured_at || sample.capturedAt || new Date().toISOString(),
  };
}

export function getBiometricZone(heartRate: number): BiometricZone {
  if (heartRate >= 108) return { id: 'high', label: 'High activation', color: '#E64980' };
  if (heartRate >= 88) return { id: 'elevated', label: 'Elevated', color: '#D97706' };
  if (heartRate >= 72) return { id: 'active', label: 'Active', color: '#3B5BDB' };
  if (heartRate >= 56) return { id: 'settled', label: 'Settled', color: '#0CA678' };
  return { id: 'low', label: 'Low and calm', color: '#6366F1' };
}

function computeTrend(current: number, recentSamples: BiometricSamplePayload[]): BiometricTrend {
  const recent = recentSamples
    .map(normalizeBiometricSample)
    .filter((sample): sample is BiometricSample => Boolean(sample))
    .slice(0, 8);

  if (recent.length < 3) {
    return { direction: 'warming-up', delta: 0, baseline: current, label: 'Collecting baseline' };
  }

  const comparison = recent.slice(1, 6);
  const baseline = Math.round(comparison.reduce((sum, sample) => sum + sample.heart_rate, 0) / comparison.length);
  const delta = current - baseline;

  if (delta >= 5) return { direction: 'rising', delta, baseline, label: 'Rising' };
  if (delta <= -5) return { direction: 'falling', delta, baseline, label: 'Settling' };
  return { direction: 'steady', delta, baseline, label: 'Steady' };
}

function chooseBreathing(zone: BiometricZone, trend: BiometricTrend, hrv: number | null): BreathingRecommendation {
  if (zone.id === 'high') return BREATHING_LIBRARY.grounding;
  if (zone.id === 'elevated') return trend.direction === 'falling' ? BREATHING_LIBRARY.box : BREATHING_LIBRARY.longExhale;
  if (zone.id === 'active') return hrv !== null && hrv < 25 ? BREATHING_LIBRARY.longExhale : BREATHING_LIBRARY.box;
  if (zone.id === 'low') return BREATHING_LIBRARY.gentle;
  return BREATHING_LIBRARY.settle;
}

function chooseMusic(zone: BiometricZone, trend: BiometricTrend, hrv: number | null): MusicRecommendation {
  if (zone.id === 'high') return MUSIC_LIBRARY.heal;
  if (zone.id === 'elevated') return trend.direction === 'falling' ? MUSIC_LIBRARY.meditate : MUSIC_LIBRARY.heal;
  if (zone.id === 'active') return hrv !== null && hrv > 55 ? MUSIC_LIBRARY.focus : MUSIC_LIBRARY.meditate;
  if (zone.id === 'low') return MUSIC_LIBRARY.sleep;
  return MUSIC_LIBRARY.meditate;
}

function confidenceFor(sampleCount: number, hrv: number | null, spo2: number | null) {
  let confidence = 45 + Math.min(sampleCount, 8) * 6;
  if (hrv !== null) confidence += 10;
  if (spo2 !== null) confidence += 5;
  return clamp(confidence, 45, 94);
}

export function buildLocalBiometricAdvice(currentSample: BiometricSamplePayload, recentSamples: BiometricSamplePayload[] = []): BiometricAdvice | null {
  const sample = normalizeBiometricSample(currentSample);
  if (!sample) return null;

  const recent = [sample, ...recentSamples]
    .map(normalizeBiometricSample)
    .filter((item): item is BiometricSample => Boolean(item));
  const zone = getBiometricZone(sample.heart_rate);
  const trend = computeTrend(sample.heart_rate, recent);
  const breathing = chooseBreathing(zone, trend, sample.hrv ?? null);
  const music = chooseMusic(zone, trend, sample.hrv ?? null);
  const targetHeartRate = zone.id === 'high'
    ? Math.max(68, sample.heart_rate - 12)
    : zone.id === 'elevated'
      ? Math.max(66, sample.heart_rate - 8)
      : zone.id === 'active'
        ? Math.max(62, sample.heart_rate - 4)
        : sample.heart_rate;

  const cautions: string[] = [];
  if (sample.heart_rate >= 130) cautions.push('Pause intense activity and use gentle breathing. Seek medical help if symptoms feel concerning.');
  if (sample.spo2 !== null && sample.spo2 !== undefined && sample.spo2 < 92) {
    cautions.push('Low oxygen readings can be inaccurate on wearables, but persistent low readings should be checked by a clinician.');
  }

  const primaryAction = zone.id === 'high'
    ? 'Ground first, then use a longer exhale before starting music.'
    : zone.id === 'elevated'
      ? 'Use a long exhale pattern and let the music settle the pace.'
      : zone.id === 'active'
        ? 'Balance breath and use alpha/theta layers to soften focus.'
        : 'Stay gentle and let the session deepen slowly.';

  return {
    generatedAt: new Date().toISOString(),
    confidence: confidenceFor(recent.length, sample.hrv ?? null, sample.spo2 ?? null),
    summary: `${zone.label} at ${sample.heart_rate} BPM. Trend: ${trend.label.toLowerCase()}.`,
    primaryAction,
    metrics: {
      heartRate: sample.heart_rate,
      hrv: sample.hrv ?? null,
      spo2: sample.spo2 ?? null,
      battery: sample.battery ?? null,
      source: sample.source,
      deviceName: sample.device_name || '',
      zone,
      trend,
      targetHeartRate,
      sampleCount: recent.length,
    },
    breathing: {
      ...breathing,
      instruction: `Try ${breathing.pattern} for ${breathing.cycles} cycles. Keep the exhale easy and unforced.`,
    },
    music: {
      ...music,
      reason: `${music.brainwave} support matches the current ${zone.label.toLowerCase()} state.`,
    },
    cautions,
  };
}

async function readJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof data?.error === 'string' ? data.error : 'Biometric request failed';
    throw new Error(message);
  }
  return data as T;
}

export function createBiometricApi(authFetch: AuthFetch) {
  return {
    async samples(limit = 50) {
      return readJson<{ samples: BiometricSample[]; pagination?: Record<string, number> }>(
        await authFetch(`/api/biometrics/samples?limit=${limit}`)
      );
    },

    async createSample(sample: BiometricSamplePayload) {
      return readJson<{ sample: BiometricSample; advice: BiometricAdvice; recommendation: unknown | null; recentCount: number }>(
        await authFetch('/api/biometrics/samples', {
          method: 'POST',
          body: JSON.stringify(sample),
        })
      );
    },

    async advice(sample: BiometricSamplePayload) {
      return readJson<{ advice: BiometricAdvice; recentCount: number }>(
        await authFetch('/api/biometrics/advice', {
          method: 'POST',
          body: JSON.stringify(sample),
        })
      );
    },

    async summary() {
      return readJson<BiometricSummary>(await authFetch('/api/biometrics/summary'));
    },
  };
}
