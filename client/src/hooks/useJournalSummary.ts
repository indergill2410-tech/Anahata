import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createJournalApi } from '../services/journalApi';
import {
  EMPTY_JOURNAL_SUMMARY,
  mirrorJournalEntriesToLocal,
  normalizeRemoteJournalEntry,
  readLocalJournalEntries,
  summarizeJournalEntries,
  JournalMemoryEntry,
} from '../services/journalMemory';

export function useJournalSummary(limit = 120) {
  const { isAuthenticated, authFetch } = useAuth();
  const api = useMemo(() => createJournalApi(authFetch), [authFetch]);
  const [entries, setEntries] = useState<JournalMemoryEntry[]>(() => readLocalJournalEntries());
  const [loading, setLoading] = useState(isAuthenticated);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      const local = readLocalJournalEntries();
      setEntries(local);
      setError(null);
      setLoading(false);
      return local;
    }

    setLoading(true);
    try {
      const data = await api.list({ limit });
      const remote = data.entries.map(normalizeRemoteJournalEntry);
      mirrorJournalEntriesToLocal(data.entries);
      setEntries(remote);
      setError(null);
      return remote;
    } catch (err) {
      const local = readLocalJournalEntries();
      setEntries(local);
      setError((err as Error).message || 'Your journal memory needs a moment.');
      return local;
    } finally {
      setLoading(false);
    }
  }, [api, isAuthenticated, limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const summary = useMemo(
    () => entries.length ? summarizeJournalEntries(entries) : EMPTY_JOURNAL_SUMMARY,
    [entries]
  );

  return {
    entries,
    summary,
    loading,
    error,
    refresh,
    isCloud: isAuthenticated,
  };
}
