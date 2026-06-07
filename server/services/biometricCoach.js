const VALID_SOURCES = new Set(['watch', 'demo', 'websocket', 'manual']);

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
};

const MUSIC_LIBRARY = {
  sleep: { intention: 'sleep', brainwave: 'Delta', binauralHz: 2, carrierHz: 180, tempo: 48, layerCue: 'tanpura, rain, low delta' },
  meditate: { intention: 'meditate', brainwave: 'Theta', binauralHz: 6, carrierHz: 200, tempo: 58, layerCue: 'om drone, sitar, river, theta' },
  heal: { intention: 'heal', brainwave: 'Theta', binauralHz: 7, carrierHz: 210, tempo: 56, layerCue: 'bowls, forest, 396Hz, theta' },
  focus: { intention: 'focus', brainwave: 'Alpha', binauralHz: 10, carrierHz: 220, tempo: 66, layerCue: 'bansuri, shruti, alpha focus' },
  energize: { intention: 'energize', brainwave: 'Beta', binauralHz: 18, carrierHz: 200, tempo: 76, layerCue: 'tabla, shruti, beta clarity' },
};

function toNumber(value, fallback = null) {
  if (value === undefined || value === null || value === '') return fallback;
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeSource(source) {
  const next = String(source || 'manual').toLowerCase();
  return VALID_SOURCES.has(next) ? next : 'manual';
}

function readHeartRate(sample) {
  return toNumber(sample.heart_rate ?? sample.heartRate, null);
}

function normalizeSample(sample) {
  return {
    ...sample,
    heart_rate: readHeartRate(sample),
    hrv: toNumber(sample.hrv, null),
    spo2: toNumber(sample.spo2, null),
    battery: toNumber(sample.battery, null),
    captured_at: sample.captured_at || sample.capturedAt || new Date().toISOString(),
  };
}

function sanitizeBiometricSample(input, extras = {}) {
  const heartRate = readHeartRate(input);
  if (!heartRate || heartRate < 30 || heartRate > 220) {
    const err = new Error('A valid heart_rate number between 30 and 220 BPM is required.');
    err.status = 400;
    throw err;
  }

  const hrv = toNumber(input.hrv, null);
  const spo2 = toNumber(input.spo2, null);
  const battery = toNumber(input.battery, null);
  const metadata = input.metadata && typeof input.metadata === 'object' && !Array.isArray(input.metadata)
    ? input.metadata
    : {};

  return {
    ...extras,
    source: normalizeSource(input.source),
    device_name: String(input.device_name || input.deviceName || '').slice(0, 120),
    heart_rate: Math.round(heartRate),
    hrv: hrv === null ? null : clamp(hrv, 0, 300),
    spo2: spo2 === null ? null : clamp(spo2, 50, 100),
    stress_level: input.stress_level ? String(input.stress_level).slice(0, 40) : '',
    battery: battery === null ? null : clamp(Math.round(battery), 0, 100),
    captured_at: input.captured_at || input.capturedAt || new Date().toISOString(),
    metadata,
  };
}

function getBiometricZone(heartRate) {
  if (heartRate >= 108) return { id: 'high', label: 'High activation', color: '#E64980' };
  if (heartRate >= 88) return { id: 'elevated', label: 'Elevated', color: '#D97706' };
  if (heartRate >= 72) return { id: 'active', label: 'Active', color: '#3B5BDB' };
  if (heartRate >= 56) return { id: 'settled', label: 'Settled', color: '#0CA678' };
  return { id: 'low', label: 'Low and calm', color: '#6366F1' };
}

function computeTrend(current, recentSamples) {
  const recent = recentSamples
    .map(normalizeSample)
    .filter(sample => typeof sample.heart_rate === 'number')
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

function chooseBreathing(zone, trend, hrv) {
  if (zone.id === 'high') return BREATHING_LIBRARY.grounding;
  if (zone.id === 'elevated') return trend.direction === 'falling' ? BREATHING_LIBRARY.box : BREATHING_LIBRARY.longExhale;
  if (zone.id === 'active') return hrv !== null && hrv < 25 ? BREATHING_LIBRARY.longExhale : BREATHING_LIBRARY.box;
  if (zone.id === 'low') return BREATHING_LIBRARY.gentle;
  return BREATHING_LIBRARY.settle;
}

function chooseMusic(zone, trend, hrv) {
  if (zone.id === 'high') return MUSIC_LIBRARY.heal;
  if (zone.id === 'elevated') return trend.direction === 'falling' ? MUSIC_LIBRARY.meditate : MUSIC_LIBRARY.heal;
  if (zone.id === 'active') return hrv !== null && hrv > 55 ? MUSIC_LIBRARY.focus : MUSIC_LIBRARY.meditate;
  if (zone.id === 'low') return MUSIC_LIBRARY.sleep;
  return MUSIC_LIBRARY.meditate;
}

function confidenceFor(sampleCount, hrv, spo2) {
  let confidence = 45 + Math.min(sampleCount, 8) * 6;
  if (hrv !== null) confidence += 10;
  if (spo2 !== null) confidence += 5;
  return clamp(confidence, 45, 94);
}

function buildBiometricAdvice(currentSample, recentSamples = []) {
  const sample = normalizeSample(currentSample);
  const heartRate = sample.heart_rate;
  if (!heartRate || heartRate < 30 || heartRate > 220) {
    const err = new Error('A valid heart rate is required to build biometric advice.');
    err.status = 400;
    throw err;
  }

  const recent = [sample, ...recentSamples.map(normalizeSample)].filter(item => item.heart_rate);
  const zone = getBiometricZone(heartRate);
  const trend = computeTrend(heartRate, recent);
  const breathing = chooseBreathing(zone, trend, sample.hrv);
  const music = chooseMusic(zone, trend, sample.hrv);
  const targetHeartRate = zone.id === 'high'
    ? Math.max(68, heartRate - 12)
    : zone.id === 'elevated'
      ? Math.max(66, heartRate - 8)
      : zone.id === 'active'
        ? Math.max(62, heartRate - 4)
        : heartRate;

  const cautions = [];
  if (heartRate >= 130) cautions.push('Pause intense activity and use gentle breathing. Seek medical help if symptoms feel concerning.');
  if (sample.spo2 !== null && sample.spo2 < 92) cautions.push('Low oxygen readings can be inaccurate on wearables, but persistent low readings should be checked by a clinician.');

  const primaryAction = zone.id === 'high'
    ? 'Ground first, then use a longer exhale before starting music.'
    : zone.id === 'elevated'
      ? 'Use a long exhale pattern and let the music settle the pace.'
      : zone.id === 'active'
        ? 'Balance breath and use alpha/theta layers to soften focus.'
        : 'Stay gentle and let the session deepen slowly.';

  return {
    generatedAt: new Date().toISOString(),
    confidence: confidenceFor(recent.length, sample.hrv, sample.spo2),
    summary: `${zone.label} at ${heartRate} BPM. Trend: ${trend.label.toLowerCase()}.`,
    primaryAction,
    metrics: {
      heartRate,
      hrv: sample.hrv,
      spo2: sample.spo2,
      battery: sample.battery,
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

module.exports = {
  VALID_SOURCES,
  sanitizeBiometricSample,
  buildBiometricAdvice,
  getBiometricZone,
};
