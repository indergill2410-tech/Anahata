import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useJournalSummary } from './useJournalSummary';
import { createUserActivityApi, LibraryFavourite, LibraryPlay, MeditationSession, SessionStats } from '../services/userActivityApi';
import { summarizeLibraryActivity } from '../services/libraryMemory';
import { BiometricSummary, createBiometricApi } from '../services/biometricCoach';

const EMPTY_BIOMETRICS: BiometricSummary = {
  samples: [],
  latestSample: null,
  latestAdvice: null,
  advice: null,
};

function newestDate(session: MeditationSession) {
  return session.created || session.created_at || '';
}

export function useUserDashboard() {
  const { isAuthenticated, authFetch } = useAuth();
  const journal = useJournalSummary(180);
  const api = useMemo(() => createUserActivityApi(authFetch), [authFetch]);
  const biometricApi = useMemo(() => createBiometricApi(authFetch), [authFetch]);
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats>({});
  const [plays, setPlays] = useState<LibraryPlay[]>([]);
  const [favourites, setFavourites] = useState<LibraryFavourite[]>([]);
  const [biometrics, setBiometrics] = useState<BiometricSummary>(EMPTY_BIOMETRICS);
  const [loadingActivity, setLoadingActivity] = useState(isAuthenticated);
  const [activityError, setActivityError] = useState<string | null>(null);

  const refreshActivity = useCallback(async () => {
    if (!isAuthenticated) {
      setSessions([]);
      setSessionStats({});
      setPlays([]);
      setFavourites([]);
      setBiometrics(EMPTY_BIOMETRICS);
      setActivityError(null);
      setLoadingActivity(false);
      return;
    }

    setLoadingActivity(true);
    try {
      const [sessionData, statsData, playData, favouriteData, biometricData] = await Promise.all([
        api.sessions(),
        api.sessionStats(),
        api.plays(),
        api.favourites(),
        biometricApi.summary(),
      ]);
      setSessions((sessionData.sessions || []).sort((a, b) => newestDate(b).localeCompare(newestDate(a))));
      setSessionStats(statsData.stats || {});
      setPlays(playData.plays || []);
      setFavourites(favouriteData.favourites || []);
      setBiometrics(biometricData || EMPTY_BIOMETRICS);
      setActivityError(null);
    } catch (err) {
      setActivityError((err as Error).message || 'Could not load dashboard activity');
    } finally {
      setLoadingActivity(false);
    }
  }, [api, biometricApi, isAuthenticated]);

  useEffect(() => {
    refreshActivity();
  }, [refreshActivity]);

  const dreamEntries = useMemo(
    () => journal.summary.entries.filter(entry => entry.entry_type === 'dream'),
    [journal.summary.entries]
  );

  const dreamLucidityAverage = useMemo(() => {
    const lucid = dreamEntries.filter(entry => typeof entry.lucidity === 'number');
    if (!lucid.length) return 0;
    return Math.round((lucid.reduce((sum, entry) => sum + (entry.lucidity || 0), 0) / lucid.length) * 10) / 10;
  }, [dreamEntries]);

  const library = useMemo(() => summarizeLibraryActivity(plays, favourites), [plays, favourites]);
  const totalSessionSeconds = sessionStats.totalDuration || sessions.reduce((sum, session) => sum + (session.duration_seconds || 0), 0);

  return {
    journal,
    dreamEntries,
    dreamLucidityAverage,
    sessions,
    sessionStats,
    library,
    biometrics,
    loading: journal.loading || loadingActivity,
    error: journal.error || activityError,
    refresh: async () => {
      await Promise.all([journal.refresh(), refreshActivity()]);
    },
    totals: {
      journalEntries: journal.summary.totalEntries,
      dreamLogs: dreamEntries.length,
      sessions: sessionStats.total || sessions.length,
      plays: library.totalPlays,
      favourites: library.favouriteCount,
      sessionMinutes: Math.round(totalSessionSeconds / 60),
      biometricSamples: biometrics.samples.length,
    },
  };
}
