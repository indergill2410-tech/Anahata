import { JournalEntry, JournalEntryPayload, JournalEntryType } from './journalApi';

export type JournalMemorySource = 'local' | 'remote';

export interface JournalMemoryEntry {
  id?: string;
  entry_type: JournalEntryType;
  entry_date: string;
  mood?: number | null;
  lucidity?: number | null;
  title?: string;
  text: string;
  follow_up?: string;
  prompt?: string;
  cta?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  source: JournalMemorySource;
  created?: string;
  updated?: string;
}

export interface JournalSummary {
  entries: JournalMemoryEntry[];
  recentEntries: JournalMemoryEntry[];
  totalEntries: number;
  checkinCount: number;
  dailyCount: number;
  dreamCount: number;
  noteCount: number;
  planCount: number;
  totalWords: number;
  streak: number;
  moodStore: Record<string, { mood: number }>;
  moodCounts: Record<number, number>;
  topMood: number | null;
  topTags: Array<{ tag: string; count: number }>;
  lastEntry: JournalMemoryEntry | null;
}

type CheckinStore = Record<string, { date?: string; mood?: number; text?: string; followUp?: string; follow_up?: string; tags?: string[]; cta?: string }>;
type DailyStore = Record<string, { date?: string; type?: string; text?: string; wordCount?: number }>;
type DreamStore = Record<string, { date?: string; lucidity?: number; emotions?: string[]; symbols?: string[]; text?: string }>;

export const CHECKIN_KEY = 'anahata_journal';
export const DAILY_KEY = 'anahata_daily';
export const DREAM_KEY = 'anahata_dreams';
export const MEMORY_KEY = 'anahata_memory_entries';

const DAILY_TYPES: Record<string, string> = {
  prompt: "Today's prompt",
  morning: 'Morning pages',
  gratitude: 'Gratitude',
  freewrite: 'Free write',
  intention: 'Intentions',
};

const DAILY_PROMPTS: Record<number, string> = {
  0: 'Where did you feel most like yourself today?',
  1: 'What are you carrying into this week, and what can you set down?',
  2: 'What small thing asked for your attention today?',
  3: 'Halfway through the week. What does your body actually need right now?',
  4: 'What conversation is still alive inside you?',
  5: "What did today ask of you that you didn't expect?",
  6: 'Where did you find rest today, even briefly?',
};

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStore<T>(key: string): T {
  if (!canUseStorage()) return {} as T;
  try { return JSON.parse(localStorage.getItem(key) || '{}') as T; }
  catch { return {} as T; }
}

function writeStore<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function cleanJournalTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags.map(tag => String(tag).trim()).filter(Boolean).slice(0, 40);
}

export function countJournalWords(text = '') {
  const clean = text.trim();
  return clean ? clean.split(/\s+/).length : 0;
}

function dateDayIndex(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  if (!year || !month || !day) return new Date().getDay();
  return new Date(year, month - 1, day).getDay();
}

function sortNewest(entries: JournalMemoryEntry[]) {
  return [...entries].sort((a, b) => {
    const dateOrder = b.entry_date.localeCompare(a.entry_date);
    if (dateOrder !== 0) return dateOrder;
    return String(b.created || b.updated || '').localeCompare(String(a.created || a.updated || ''));
  });
}

export function normalizeRemoteJournalEntry(entry: JournalEntry): JournalMemoryEntry {
  return {
    id: entry.id,
    entry_type: entry.entry_type,
    entry_date: entry.entry_date,
    mood: entry.mood ?? null,
    lucidity: entry.lucidity ?? null,
    title: entry.title || '',
    text: entry.text || '',
    follow_up: entry.follow_up || '',
    prompt: entry.prompt || '',
    cta: entry.cta || '',
    tags: cleanJournalTags(entry.tags),
    metadata: asRecord(entry.metadata),
    source: 'remote',
    created: entry.created,
    updated: entry.updated,
  };
}

export function readLocalJournalEntries(): JournalMemoryEntry[] {
  const checkins = readStore<CheckinStore>(CHECKIN_KEY);
  const daily = readStore<DailyStore>(DAILY_KEY);
  const dreams = readStore<DreamStore>(DREAM_KEY);
  const memory = readStore<JournalMemoryEntry[]>(MEMORY_KEY);
  const entries: JournalMemoryEntry[] = [];

  Object.entries(checkins).forEach(([date, entry]) => {
    entries.push({
      entry_type: 'checkin',
      entry_date: date,
      mood: entry.mood ?? null,
      title: 'Daily check-in',
      text: entry.text || '',
      follow_up: entry.follow_up || entry.followUp || '',
      cta: entry.cta || '',
      tags: cleanJournalTags(entry.tags),
      metadata: {},
      source: 'local',
    });
  });

  Object.entries(daily).forEach(([date, entry]) => {
    const dailyType = entry.type || 'freewrite';
    entries.push({
      entry_type: 'daily',
      entry_date: date,
      title: DAILY_TYPES[dailyType] || 'Daily entry',
      text: entry.text || '',
      prompt: DAILY_PROMPTS[dateDayIndex(date)] || '',
      tags: [],
      metadata: { daily_type: dailyType, word_count: entry.wordCount || countJournalWords(entry.text || '') },
      source: 'local',
    });
  });

  Object.entries(dreams).forEach(([date, entry]) => {
    const emotions = cleanJournalTags(entry.emotions);
    const symbols = cleanJournalTags(entry.symbols);
    entries.push({
      entry_type: 'dream',
      entry_date: date,
      lucidity: entry.lucidity ?? null,
      title: 'Dream journal',
      text: entry.text || '',
      tags: [...emotions, ...symbols],
      metadata: { emotions, symbols },
      source: 'local',
    });
  });

  return sortNewest([...entries, ...(Array.isArray(memory) ? memory : [])]);
}

export function mirrorJournalEntryToLocal(entry: JournalEntry | JournalEntryPayload) {
  const metadata = asRecord(entry.metadata);
  const date = entry.entry_date;

  if (entry.entry_type === 'note' || entry.entry_type === 'plan') {
    const store = readStore<JournalMemoryEntry[]>(MEMORY_KEY);
    const next: JournalMemoryEntry = {
      id: 'id' in entry ? entry.id : undefined,
      entry_type: entry.entry_type,
      entry_date: date,
      title: entry.title || (entry.entry_type === 'plan' ? 'Flight path' : 'Field note'),
      text: entry.text || '',
      follow_up: entry.follow_up || '',
      prompt: entry.prompt || '',
      cta: entry.cta || '',
      tags: cleanJournalTags(entry.tags),
      metadata,
      source: 'id' in entry ? 'remote' : 'local',
      created: 'created' in entry ? entry.created : new Date().toISOString(),
      updated: 'updated' in entry ? entry.updated : undefined,
    };
    const key = next.id || `${next.entry_type}-${next.entry_date}-${next.created}`;
    const filtered = (Array.isArray(store) ? store : []).filter(item => (item.id || `${item.entry_type}-${item.entry_date}-${item.created}`) !== key);
    writeStore(MEMORY_KEY, sortNewest([next, ...filtered]));
    return;
  }

  if (entry.entry_type === 'checkin') {
    const store = readStore<CheckinStore>(CHECKIN_KEY);
    store[date] = {
      date,
      mood: entry.mood ?? 0,
      text: entry.text || '',
      followUp: entry.follow_up || '',
      tags: cleanJournalTags(entry.tags),
      cta: entry.cta || '',
    };
    writeStore(CHECKIN_KEY, store);
    return;
  }

  if (entry.entry_type === 'daily') {
    const store = readStore<DailyStore>(DAILY_KEY);
    const dailyType = typeof metadata.daily_type === 'string' ? metadata.daily_type : 'freewrite';
    store[date] = {
      date,
      type: dailyType,
      text: entry.text || '',
      wordCount: countJournalWords(entry.text || ''),
    };
    writeStore(DAILY_KEY, store);
    return;
  }

  const store = readStore<DreamStore>(DREAM_KEY);
  store[date] = {
    date,
    lucidity: entry.lucidity ?? 0,
    emotions: cleanJournalTags(metadata.emotions),
    symbols: cleanJournalTags(metadata.symbols),
    text: entry.text || '',
  };
  writeStore(DREAM_KEY, store);
}

export function mirrorJournalEntriesToLocal(entries: Array<JournalEntry | JournalEntryPayload>) {
  entries.forEach(mirrorJournalEntryToLocal);
}

export function clearLocalJournalEntries() {
  if (!canUseStorage()) return;
  localStorage.removeItem(CHECKIN_KEY);
  localStorage.removeItem(DAILY_KEY);
  localStorage.removeItem(DREAM_KEY);
  localStorage.removeItem(MEMORY_KEY);
}

export function memoryEntryToPayload(entry: JournalMemoryEntry): JournalEntryPayload {
  return {
    entry_type: entry.entry_type,
    entry_date: entry.entry_date,
    mood: entry.mood ?? null,
    lucidity: entry.lucidity ?? null,
    title: entry.title || '',
    text: entry.text || '',
    follow_up: entry.follow_up || '',
    prompt: entry.prompt || '',
    cta: entry.cta || '',
    tags: entry.tags || [],
    metadata: entry.metadata || {},
  };
}

export function computeJournalStreak(entries: JournalMemoryEntry[]) {
  const dates = new Set(entries.map(entry => entry.entry_date));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (true) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    if (!dates.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function summarizeJournalEntries(entries: JournalMemoryEntry[]): JournalSummary {
  const sorted = sortNewest(entries);
  const moodStore: Record<string, { mood: number }> = {};
  const moodCounts: Record<number, number> = {};
  const tagCounts: Record<string, number> = {};

  sorted.forEach(entry => {
    if (entry.entry_type === 'checkin' && typeof entry.mood === 'number' && entry.mood > 0) {
      moodStore[entry.entry_date] = { mood: entry.mood };
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    }

    entry.tags.forEach(tag => {
      const key = tag.toLowerCase();
      tagCounts[key] = (tagCounts[key] || 0) + 1;
    });
  });

  const topMoodText = Object.keys(moodCounts).sort((a, b) => moodCounts[Number(b)] - moodCounts[Number(a)])[0];
  const topTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, 6);

  return {
    entries: sorted,
    recentEntries: sorted.slice(0, 6),
    totalEntries: sorted.length,
    checkinCount: sorted.filter(entry => entry.entry_type === 'checkin').length,
    dailyCount: sorted.filter(entry => entry.entry_type === 'daily').length,
    dreamCount: sorted.filter(entry => entry.entry_type === 'dream').length,
    noteCount: sorted.filter(entry => entry.entry_type === 'note').length,
    planCount: sorted.filter(entry => entry.entry_type === 'plan').length,
    totalWords: sorted.reduce((sum, entry) => sum + countJournalWords(entry.text), 0),
    streak: computeJournalStreak(sorted),
    moodStore,
    moodCounts,
    topMood: topMoodText ? Number(topMoodText) : null,
    topTags,
    lastEntry: sorted[0] || null,
  };
}

export const EMPTY_JOURNAL_SUMMARY = summarizeJournalEntries([]);
