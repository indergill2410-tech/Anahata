export type JournalEntryType = 'checkin' | 'daily' | 'dream' | 'note' | 'plan';

export interface JournalEntryPayload {
  entry_type: JournalEntryType;
  entry_date: string;
  mood?: number | null;
  lucidity?: number | null;
  title?: string;
  text?: string;
  follow_up?: string;
  prompt?: string;
  cta?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface JournalEntry extends JournalEntryPayload {
  id: string;
  user_id: string;
  created?: string;
  updated?: string;
}

type AuthFetch = (url: string, options?: RequestInit) => Promise<Response>;

async function readJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof data?.error === 'string' ? data.error : 'Your journal needs another try.';
    throw new Error(message);
  }
  return data as T;
}

function toQuery(params: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') qs.set(key, String(value));
  });
  const text = qs.toString();
  return text ? `?${text}` : '';
}

export function createJournalApi(authFetch: AuthFetch) {
  return {
    async list(params: { type?: JournalEntryType; from?: string; to?: string; page?: number; limit?: number } = {}) {
      return readJson<{ entries: JournalEntry[]; pagination: Record<string, number> }>(
        await authFetch(`/api/journal${toQuery(params)}`)
      );
    },

    async save(entry: JournalEntryPayload) {
      return readJson<{ entry: JournalEntry }>(
        await authFetch('/api/journal', {
          method: 'POST',
          body: JSON.stringify(entry),
        })
      );
    },

    async update(id: string, entry: Partial<JournalEntryPayload>) {
      return readJson<{ entry: JournalEntry }>(
        await authFetch(`/api/journal/${id}`, {
          method: 'PUT',
          body: JSON.stringify(entry),
        })
      );
    },

    async remove(id: string) {
      const res = await authFetch(`/api/journal/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data?.error === 'string' ? data.error : 'This journal entry needs another try before it can be removed.');
      }
    },

    async importEntries(entries: JournalEntryPayload[]) {
      return readJson<{ imported: JournalEntry[]; skipped: unknown[]; count: number }>(
        await authFetch('/api/journal/import', {
          method: 'POST',
          body: JSON.stringify({ entries }),
        })
      );
    },

    async exportEntries() {
      return readJson<{ exported_at: string; count: number; entries: JournalEntry[] }>(
        await authFetch('/api/journal/export')
      );
    },

    async deleteAll() {
      return readJson<{ deleted: number }>(
        await authFetch('/api/journal', { method: 'DELETE' })
      );
    },
  };
}
