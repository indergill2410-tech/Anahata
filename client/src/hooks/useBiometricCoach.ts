import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  BiometricAdvice,
  BiometricSample,
  BiometricSamplePayload,
  BiometricSource,
  BiometricSummary,
  buildLocalBiometricAdvice,
  createBiometricApi,
  normalizeBiometricSample,
} from '../services/biometricCoach';

interface UseBiometricCoachOptions {
  heartRate: number | null;
  source: BiometricSource;
  deviceName?: string | null;
  battery?: number | null;
  hrv?: number | null;
  spo2?: number | null;
  enabled?: boolean;
  saveIntervalMs?: number;
}

const EMPTY_SUMMARY: BiometricSummary = {
  samples: [],
  latestSample: null,
  latestAdvice: null,
  advice: null,
};

export function useBiometricCoach({
  heartRate,
  source,
  deviceName,
  battery,
  hrv,
  spo2,
  enabled = true,
  saveIntervalMs = 15000,
}: UseBiometricCoachOptions) {
  const { isAuthenticated, authFetch } = useAuth();
  const api = useMemo(() => createBiometricApi(authFetch), [authFetch]);
  const [samples, setSamples] = useState<BiometricSample[]>([]);
  const [lastSample, setLastSample] = useState<BiometricSample | null>(null);
  const [advice, setAdvice] = useState<BiometricAdvice | null>(null);
  const [latestAdviceRecord, setLatestAdviceRecord] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const samplesRef = useRef<BiometricSample[]>([]);
  const lastCapturedAtRef = useRef(0);
  const inFlightRef = useRef(false);

  useEffect(() => {
    samplesRef.current = samples;
  }, [samples]);

  useEffect(() => {
    if (enabled && heartRate) return;
    setLastSample(null);
    setAdvice(null);
  }, [enabled, heartRate]);

  const makePayload = useCallback((): BiometricSamplePayload | null => {
    if (!enabled || !heartRate) return null;
    return {
      source,
      deviceName,
      battery,
      hrv,
      spo2,
      heartRate,
      capturedAt: new Date().toISOString(),
      metadata: { capture: 'journey-live' },
    };
  }, [battery, deviceName, enabled, heartRate, hrv, source, spo2]);

  const refreshSummary = useCallback(async () => {
    if (!isAuthenticated) {
      setSamples([]);
      setLastSample(null);
      setAdvice(null);
      setLatestAdviceRecord(null);
      setError(null);
      return EMPTY_SUMMARY;
    }

    setLoading(true);
    try {
      const summary = await api.summary();
      setSamples(summary.samples || []);
      setLastSample(summary.latestSample || null);
      setAdvice(summary.advice || null);
      setLatestAdviceRecord(summary.latestAdvice || null);
      setError(null);
      return summary;
    } catch (err) {
      setError((err as Error).message || 'Could not load biometric summary');
      return EMPTY_SUMMARY;
    } finally {
      setLoading(false);
    }
  }, [api, isAuthenticated]);

  const saveSample = useCallback(async (payload: BiometricSamplePayload) => {
    if (!isAuthenticated || inFlightRef.current) return null;
    inFlightRef.current = true;
    try {
      const saved = await api.createSample(payload);
      setSamples(prev => [saved.sample, ...prev.filter(item => item.id !== saved.sample.id)].slice(0, 24));
      setLastSample(saved.sample);
      setAdvice(saved.advice);
      setLatestAdviceRecord(saved.recommendation);
      setError(null);
      return saved;
    } catch (err) {
      setError((err as Error).message || 'Could not save biometric sample');
      return null;
    } finally {
      inFlightRef.current = false;
    }
  }, [api, isAuthenticated]);

  const captureNow = useCallback(async () => {
    const payload = makePayload();
    if (!payload) return null;

    const localSample = normalizeBiometricSample(payload);
    if (!localSample) return null;

    const localAdvice = buildLocalBiometricAdvice(localSample, samplesRef.current);
    setSamples(prev => [localSample, ...prev].slice(0, 24));
    setLastSample(localSample);
    setAdvice(localAdvice);
    lastCapturedAtRef.current = Date.now();

    if (isAuthenticated) {
      return saveSample(payload);
    }

    return { sample: localSample, advice: localAdvice, recommendation: null, recentCount: samplesRef.current.length + 1 };
  }, [isAuthenticated, makePayload, saveSample]);

  useEffect(() => {
    if (!isAuthenticated) return;
    refreshSummary();
  }, [isAuthenticated, refreshSummary]);

  useEffect(() => {
    const payload = makePayload();
    if (!payload) return;

    const localSample = normalizeBiometricSample(payload);
    if (!localSample) return;

    const localAdvice = buildLocalBiometricAdvice(localSample, samplesRef.current);
    setLastSample(localSample);
    setAdvice(localAdvice);

    const now = Date.now();
    if (now - lastCapturedAtRef.current < saveIntervalMs) return;
    lastCapturedAtRef.current = now;
    setSamples(prev => [localSample, ...prev].slice(0, 24));

    if (isAuthenticated) saveSample(payload);
  }, [isAuthenticated, makePayload, saveIntervalMs, saveSample]);

  return {
    advice,
    samples,
    lastSample,
    latestAdviceRecord,
    connected: Boolean(heartRate),
    loading,
    error,
    captureNow,
    refreshSummary,
  };
}
