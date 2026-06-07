export interface MeditationSession {
  id: string;
  brainwave_state?: string | null;
  created?: string;
  created_at?: string;
  heart_rate?: number | null;
  duration_seconds?: number | null;
}

export interface SessionStats {
  total?: number;
  avgHeartRate?: number;
  totalDuration?: number;
  topBrainwaveState?: string | null;
  stateCounts?: Record<string, number>;
}

export interface LibraryPlay {
  id: string;
  track_id: string;
  duration_played?: number | null;
  created?: string;
}

export interface LibraryFavourite {
  id: string;
  track_id: string;
  created?: string;
}

type AuthFetch = (url: string, options?: RequestInit) => Promise<Response>;

async function readJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof data?.error === 'string' ? data.error : 'Activity request failed';
    throw new Error(message);
  }
  return data as T;
}

export function createUserActivityApi(authFetch: AuthFetch) {
  return {
    async sessions() {
      return readJson<{ sessions: MeditationSession[] }>(await authFetch('/api/sessions'));
    },

    async sessionStats() {
      return readJson<{ stats: SessionStats }>(await authFetch('/api/sessions/stats'));
    },

    async plays() {
      return readJson<{ plays: LibraryPlay[] }>(await authFetch('/api/library/plays'));
    },

    async favourites() {
      return readJson<{ favourites: LibraryFavourite[] }>(await authFetch('/api/library/favourites'));
    },

    async recordPlay(trackId: string, durationPlayed = 0) {
      return readJson<{ play: LibraryPlay }>(await authFetch('/api/library/plays', {
        method: 'POST',
        body: JSON.stringify({ track_id: trackId, duration_played: durationPlayed }),
      }));
    },
  };
}
