import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSoundEngine, INTENTIONS } from '../context/SoundEngineContext';
import { createJournalApi, JournalEntryPayload, JournalEntryType } from '../services/journalApi';
import {
  cleanJournalTags,
  countJournalWords,
  JournalMemoryEntry,
  memoryEntryToPayload,
  mirrorJournalEntriesToLocal,
  mirrorJournalEntryToLocal,
  normalizeRemoteJournalEntry,
  readLocalJournalEntries,
  summarizeJournalEntries,
} from '../services/journalMemory';

type JournalTab = JournalEntryType;

type JournalPageProps = {
  onRequireAuth?: () => void;
  onTabChange?: (tab: 'journey') => void;
};

// A mood check-in naturally maps onto one of the SoundEngine's intentions,
// so saving how you feel can lead straight into a session tuned for it.
const MOOD_INTENTION: Record<number, keyof typeof INTENTIONS> = {
  1: 'heal',
  2: 'meditate',
  3: 'focus',
  4: 'energize',
  5: 'meditate',
};

const PENDING_KEY = 'anahata_pending_journal';

const TAB_META: Record<JournalTab, { label: string; color: string; sub: string }> = {
  checkin: { label: 'Check-in', color: '#7048E8', sub: 'Mood, tags, and one honest reflection.' },
  daily: { label: 'Journal', color: '#D97706', sub: 'A deeper page from the inner universe.' },
  dream: { label: 'Dreams', color: '#6366F1', sub: 'Capture dream fragments before they fade.' },
  note: { label: 'Notes', color: '#0CA678', sub: 'Quick field notes and passing signals.' },
  plan: { label: 'Plans', color: '#3B5BDB', sub: 'Flight paths, intentions, and next steps.' },
};

const MOODS = [
  { value: 1, label: 'Rough', color: '#E64980' },
  { value: 2, label: 'Okay', color: '#F59F00' },
  { value: 3, label: 'Good', color: '#0CA678' },
  { value: 4, label: 'Great', color: '#3B5BDB' },
  { value: 5, label: 'Blissful', color: '#7048E8' },
];

const CHECKIN_TAGS = ['calm', 'focused', 'grateful', 'restless', 'anxious', 'peaceful', 'energised', 'creative', 'tired', 'inspired'];
const CTA_OPTIONS = [
  { id: 'day', label: 'Tell me about your day' },
  { id: 'weight', label: "What's weighing on you?" },
  { id: 'grateful', label: "Something you're grateful for" },
  { id: 'win', label: 'Celebrate a win' },
  { id: 'release', label: 'Something to let go' },
];

const DAILY_TYPES = [
  { id: 'prompt', label: "Today's prompt", color: '#D97706' },
  { id: 'morning', label: 'Morning pages', color: '#7048E8' },
  { id: 'gratitude', label: 'Gratitude', color: '#0CA678' },
  { id: 'freewrite', label: 'Free write', color: '#E64980' },
  { id: 'intention', label: 'Intentions', color: '#3B5BDB' },
];

const DAILY_PROMPTS: Record<number, string> = {
  0: 'Where did you feel most like yourself today?',
  1: 'What are you carrying into this week, and what can you set down?',
  2: 'What small thing asked for your attention today?',
  3: 'Halfway through the week. What does your body actually need right now?',
  4: 'What conversation is still alive inside you?',
  5: "What did today ask of you that you didn't expect?",
  6: 'Where did you find rest today, even briefly?',
};

const DREAM_EMOTIONS = ['joy', 'fear', 'calm', 'intense', 'surreal', 'wonder', 'sorrow', 'peace'];
const DREAM_SYMBOLS = ['water', 'house', 'flying', 'chase', 'forest', 'key', 'mirror', 'bridge', 'spiral', 'light', 'falling', 'door'];

function todayKey() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

function offsetDateKey(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDate(key: string, style: 'short' | 'long' = 'long') {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', style === 'short'
    ? { month: 'short', day: 'numeric' }
    : { weekday: 'long', month: 'long', day: 'numeric' });
}

function tone(color: string, alpha = '14') {
  return `${color}${alpha}`;
}

function sameEntry(a: JournalMemoryEntry, b: JournalMemoryEntry) {
  if (a.id && b.id) return a.id === b.id;
  if (a.entry_type === 'note' || a.entry_type === 'plan' || b.entry_type === 'note' || b.entry_type === 'plan') {
    return a.entry_type === b.entry_type && a.entry_date === b.entry_date && a.text === b.text && a.title === b.title;
  }
  return a.entry_type === b.entry_type && a.entry_date === b.entry_date;
}

function entryKey(entry: JournalMemoryEntry) {
  return entry.id || `${entry.source}-${entry.entry_type}-${entry.entry_date}-${entry.created || entry.title || ''}-${entry.text.slice(0, 40)}`;
}

function previewText(text = '', fallback = 'Untitled entry', max = 118) {
  const clean = (text || '').trim() || (fallback || 'Untitled entry').trim();
  return clean.length > max ? `${clean.slice(0, max)}...` : clean;
}

function readPendingDraft(): JournalEntryPayload | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as JournalEntryPayload;
    return parsed?.entry_type && parsed?.entry_date ? parsed : null;
  } catch {
    return null;
  }
}

function SectionLabel({ children, color = 'var(--ink3)' }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 0, textTransform: 'uppercase', color, fontFamily: "'Space Grotesk', sans-serif" }}>
      {children}
    </div>
  );
}

function JournalOrb({ color, size = 64, children }: { color: string; size?: number; children?: React.ReactNode }) {
  return (
    <div style={{ width: size, height: size, position: 'relative', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
      <span style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: `1px solid ${color}26` }} />
      <span style={{ position: 'absolute', inset: -2, borderRadius: '50%', border: `1.5px solid ${color}38`, boxShadow: `0 0 24px ${color}28` }} />
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background: `radial-gradient(circle at 34% 28%, #FFFFFF, ${color} 48%, ${color}92 78%)`,
        boxShadow: `inset 0 2px 12px rgba(255,255,255,0.4), 0 14px 34px ${color}34`,
        color: '#FFFFFF',
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 900,
      }}>
        {children}
      </div>
    </div>
  );
}

function Chip({ active, color, children, onClick }: { active: boolean; color: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      aria-pressed={active}
      onClick={onClick}
      style={{
        border: `1.5px solid ${active ? color : 'rgba(23,18,10,0.08)'}`,
        background: active ? tone(color, '12') : '#FFFFFF',
        color: active ? color : 'var(--ink2)',
        borderRadius: 999,
        padding: '8px 12px',
        fontSize: 12,
        fontWeight: 900,
        fontFamily: "'Space Grotesk', sans-serif",
        boxShadow: active ? `0 4px 14px ${tone(color, '22')}` : '0 1px 6px rgba(23,18,10,0.04)',
      }}
    >
      {children}
    </button>
  );
}

function ModeLens({ tab, active, count, onClick }: { tab: JournalTab; active: boolean; count: number; onClick: () => void }) {
  const meta = TAB_META[tab];
  return (
    <motion.button
      aria-pressed={active}
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.96 }}
      style={{
        minHeight: 78,
        borderRadius: 22,
        border: `1.5px solid ${active ? meta.color : 'rgba(23,18,10,0.08)'}`,
        background: active ? `linear-gradient(180deg, #FFFFFF, ${tone(meta.color, '10')})` : 'rgba(255,255,255,0.72)',
        color: active ? meta.color : 'var(--ink2)',
        boxShadow: active ? `0 10px 24px ${tone(meta.color, '24')}` : '0 4px 14px rgba(23,18,10,0.035)',
        padding: '12px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        textAlign: 'left',
      }}
    >
      <JournalOrb color={meta.color} size={32}>
        <span style={{ fontSize: 10 }}>{count}</span>
      </JournalOrb>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 900 }}>{meta.label}</span>
        <span style={{ display: 'block', marginTop: 2, fontSize: 10, color: active ? meta.color : 'var(--ink3)', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{count} saved</span>
      </span>
    </motion.button>
  );
}

function DateChip({ date, selected, hasEntry, color, onClick }: { date: string; selected: boolean; hasEntry: boolean; color: string; onClick: () => void }) {
  const isToday = date === todayKey();
  return (
    <motion.button
      aria-pressed={selected}
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      style={{
        flex: '0 0 auto',
        width: 72,
        minHeight: 62,
        borderRadius: 22,
        border: `1.5px solid ${selected ? color : 'rgba(23,18,10,0.08)'}`,
        background: selected ? `linear-gradient(180deg, #FFFFFF, ${tone(color, '10')})` : '#FFFFFF',
        color: selected ? color : 'var(--ink2)',
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 11,
        fontWeight: 900,
        position: 'relative',
        boxShadow: selected ? `0 8px 20px ${tone(color, '24')}` : '0 2px 10px rgba(23,18,10,0.04)',
      }}
    >
      <span style={{ display: 'block' }}>{isToday ? 'Today' : formatDate(date, 'short')}</span>
      <span style={{ display: 'block', width: hasEntry ? 8 : 4, height: hasEntry ? 8 : 4, borderRadius: '50%', margin: '9px auto 0', background: hasEntry ? color : 'rgba(23,18,10,0.12)', boxShadow: hasEntry ? `0 0 14px ${tone(color, '65')}` : 'none' }} />
    </motion.button>
  );
}

function monthKey(dateKey: string) {
  return /^\d{4}-\d{2}/.test(dateKey) ? dateKey.slice(0, 7) : todayKey().slice(0, 7);
}

function dateKeyFromDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function shiftMonth(key: string, amount: number) {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(year, (month || 1) - 1 + amount, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonth(key: string) {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, (month || 1) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function buildCalendarDays(key: string) {
  const [year, month] = key.split('-').map(Number);
  const first = new Date(year, (month || 1) - 1, 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const date = dateKeyFromDate(day);
    return { date, inMonth: monthKey(date) === key, day: day.getDate() };
  });
}

function CalendarMonth({
  month,
  selectedDate,
  entries,
  activeTab,
  onMonthChange,
  onSelectDate,
  onSelectEntryType,
}: {
  month: string;
  selectedDate: string;
  entries: JournalMemoryEntry[];
  activeTab: JournalTab;
  onMonthChange: (next: string) => void;
  onSelectDate: (date: string) => void;
  onSelectEntryType: (tab: JournalTab) => void;
}) {
  const selectedEntries = entries.filter(entry => entry.entry_date === selectedDate);
  const activeColor = TAB_META[activeTab].color;
  const days = buildCalendarDays(month);

  return (
    <section data-effect="journal-calendar" style={{
      borderRadius: 28,
      padding: 16,
      background: 'linear-gradient(145deg, #FFFFFF, rgba(112,72,232,0.055))',
      border: '1px solid rgba(112,72,232,0.13)',
      boxShadow: 'var(--shadow)',
      display: 'flex',
      flexDirection: 'column',
      gap: 13,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <SectionLabel color="#7048E8">Practice calendar</SectionLabel>
          <p style={{ margin: '4px 0 0', color: 'var(--ink3)', fontSize: 12 }}>Every saved day becomes part of your rhythm.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
          <button aria-label="Previous month" onClick={() => onMonthChange(shiftMonth(month, -1))} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(23,18,10,0.08)', background: '#FFFFFF', color: 'var(--ink2)', display: 'grid', placeItems: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <button aria-label="Next month" onClick={() => onMonthChange(shiftMonth(month, 1))} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(23,18,10,0.08)', background: '#FFFFFF', color: 'var(--ink2)', display: 'grid', placeItems: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, lineHeight: 1, color: 'var(--ink1)' }}>{formatMonth(month)}</h2>
        <button onClick={() => { onMonthChange(monthKey(todayKey())); onSelectDate(todayKey()); }} style={{ borderRadius: 999, border: '1px solid rgba(112,72,232,0.18)', background: 'rgba(112,72,232,0.08)', color: '#7048E8', padding: '8px 11px', fontSize: 11, fontWeight: 900 }}>
          Today
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div key={`${day}-${index}`} style={{ textAlign: 'center', fontSize: 10, color: 'var(--ink3)', fontWeight: 900 }}>{day}</div>
        ))}
        {days.map(day => {
          const dayEntries = entries.filter(entry => entry.entry_date === day.date);
          const isSelected = day.date === selectedDate;
          const hasActive = dayEntries.some(entry => entry.entry_type === activeTab);
          return (
            <button
              key={day.date}
              onClick={() => onSelectDate(day.date)}
              aria-pressed={isSelected}
              style={{
                minWidth: 0,
                aspectRatio: '1 / 1',
                borderRadius: 16,
                border: `1.5px solid ${isSelected ? activeColor : hasActive ? tone(activeColor, '40') : 'rgba(23,18,10,0.065)'}`,
                background: isSelected ? `linear-gradient(180deg, #FFFFFF, ${tone(activeColor, '12')})` : day.inMonth ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
                color: day.inMonth ? 'var(--ink2)' : 'rgba(23,18,10,0.34)',
                boxShadow: isSelected ? `0 8px 20px ${tone(activeColor, '24')}` : 'none',
                padding: 5,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 900 }}>{day.day}</span>
              <span style={{ display: 'flex', justifyContent: 'center', gap: 2, minHeight: 10 }}>
                {(Object.keys(TAB_META) as JournalTab[]).map(tab => {
                  const visible = dayEntries.some(entry => entry.entry_type === tab);
                  return visible ? <span key={tab} style={{ width: 6, height: 6, borderRadius: '50%', background: TAB_META[tab].color, boxShadow: `0 0 10px ${tone(TAB_META[tab].color, '65')}` }} /> : null;
                })}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ borderRadius: 20, padding: 13, background: '#FFFFFF', border: `1px solid ${tone(activeColor, '1E')}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: selectedEntries.length ? 10 : 0 }}>
          <div>
            <SectionLabel color={activeColor}>{formatDate(selectedDate, 'short')}</SectionLabel>
            <p style={{ margin: '4px 0 0', color: 'var(--ink3)', fontSize: 12 }}>{selectedEntries.length ? 'Saved on this day' : 'A fresh space is open for this day.'}</p>
          </div>
          <JournalOrb color={activeColor} size={34}>
            <span style={{ fontSize: 10 }}>{selectedEntries.length || '+'}</span>
          </JournalOrb>
        </div>
        {selectedEntries.length > 0 && (
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {selectedEntries.map(entry => {
              const meta = TAB_META[entry.entry_type];
              return (
                <button
                  key={`${entry.entry_type}-${entry.entry_date}-${entry.id || 'local'}`}
                  onClick={() => onSelectEntryType(entry.entry_type)}
                  style={{
                    borderRadius: 999,
                    border: `1px solid ${tone(meta.color, '2A')}`,
                    background: tone(meta.color, '0F'),
                    color: meta.color,
                    padding: '7px 10px',
                    fontSize: 11,
                    fontWeight: 900,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default function JournalPage({ onRequireAuth, onTabChange }: JournalPageProps) {
  const { isAuthenticated, authFetch } = useAuth();
  const { success, error, info } = useToast();
  const engine = useSoundEngine();
  const [moodSuggestion, setMoodSuggestion] = useState<{ key: keyof typeof INTENTIONS; mood: number } | null>(null);
  const initialPending = useMemo(() => readPendingDraft(), []);
  const skipHydrateRef = useRef(Boolean(initialPending));
  const api = useMemo(() => createJournalApi(authFetch), [authFetch]);

  const [activeTab, setActiveTab] = useState<JournalTab>(initialPending?.entry_type || 'checkin');
  const [selectedDate, setSelectedDate] = useState(initialPending?.entry_date || todayKey());
  const [selectedEntryKey, setSelectedEntryKey] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(monthKey(initialPending?.entry_date || todayKey()));
  const [localEntries, setLocalEntries] = useState<JournalMemoryEntry[]>(() => readLocalJournalEntries());
  const [remoteEntries, setRemoteEntries] = useState<JournalMemoryEntry[]>([]);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [showDetails, setShowDetails] = useState(Boolean(initialPending));

  const [draft, setDraft] = useState(initialPending?.text ?? '');
  const [followUp, setFollowUp] = useState(initialPending?.follow_up ?? '');
  const [mood, setMood] = useState(initialPending?.mood ?? 3);
  const [cta, setCta] = useState(initialPending?.cta || 'day');
  const [tags, setTags] = useState<string[]>(cleanJournalTags(initialPending?.tags));
  const [dailyType, setDailyType] = useState(typeof initialPending?.metadata?.daily_type === 'string' ? initialPending.metadata.daily_type : 'prompt');
  const [lucidity, setLucidity] = useState(initialPending?.lucidity ?? 3);
  const [emotions, setEmotions] = useState<string[]>(cleanJournalTags(initialPending?.metadata?.emotions));
  const [symbols, setSymbols] = useState<string[]>(cleanJournalTags(initialPending?.metadata?.symbols));

  const entries = isAuthenticated ? remoteEntries : localEntries;
  const summary = useMemo(() => summarizeJournalEntries(entries), [entries]);
  const currentEntry = selectedEntryKey ? entries.find(entry => entryKey(entry) === selectedEntryKey) : null;
  const currentMeta = TAB_META[activeTab];
  const prompt = DAILY_PROMPTS[new Date(`${selectedDate}T00:00:00`).getDay()] || DAILY_PROMPTS[0];

  const refreshLocal = useCallback(() => setLocalEntries(readLocalJournalEntries()), []);

  const refreshRemote = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingRemote(true);
    try {
      const data = await api.list({ limit: 140 });
      const next = data.entries.map(normalizeRemoteJournalEntry);
      setRemoteEntries(next);
      mirrorJournalEntriesToLocal(data.entries);
      refreshLocal();
    } catch (err) {
      error((err as Error).message || 'Your journal needs a moment to refresh.');
    } finally {
      setLoadingRemote(false);
    }
  }, [api, error, isAuthenticated, refreshLocal]);

  useEffect(() => {
    refreshLocal();
    if (isAuthenticated) refreshRemote();
    else setRemoteEntries([]);
  }, [isAuthenticated, refreshLocal, refreshRemote]);

  useEffect(() => {
    setShowDetails(false);
  }, [activeTab, selectedDate]);

  useEffect(() => {
    setCalendarMonth(monthKey(selectedDate));
  }, [selectedDate]);

  useEffect(() => {
    if (skipHydrateRef.current) {
      skipHydrateRef.current = false;
      return;
    }
    if (!currentEntry) {
      setDraft('');
      setFollowUp('');
      setMood(3);
      setCta('day');
      setTags([]);
      setDailyType('prompt');
      setLucidity(3);
      setEmotions([]);
      setSymbols([]);
      return;
    }
    setDraft(currentEntry.text ?? '');
    setFollowUp(currentEntry?.follow_up ?? '');
    setMood(currentEntry?.mood ?? 3);
    setCta(currentEntry?.cta || 'day');
    setTags(currentEntry?.tags || []);
    setDailyType(typeof currentEntry?.metadata?.daily_type === 'string' ? currentEntry.metadata.daily_type : 'prompt');
    setLucidity(currentEntry?.lucidity ?? 3);
    setEmotions(cleanJournalTags(currentEntry?.metadata?.emotions));
    setSymbols(cleanJournalTags(currentEntry?.metadata?.symbols));
  }, [currentEntry, selectedEntryKey]);

  const unsyncedLocalEntries = useMemo(() => {
    if (!isAuthenticated) return [];
    return localEntries.filter(local => !remoteEntries.some(remote => sameEntry(local, remote)));
  }, [isAuthenticated, localEntries, remoteEntries]);

  const filteredHistory = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries
      .filter(entry => entry.entry_type === activeTab)
      .filter(entry => !q || [entry.title, entry.text, entry.follow_up, entry.tags.join(' ')].join(' ').toLowerCase().includes(q))
      .sort((a, b) => b.entry_date.localeCompare(a.entry_date));
  }, [activeTab, entries, search]);

  const tabCounts = useMemo(() => {
    const counts: Record<JournalTab, number> = { checkin: 0, daily: 0, dream: 0, note: 0, plan: 0 };
    entries.forEach(entry => {
      if (entry.entry_type in counts) {
        counts[entry.entry_type] += 1;
      }
    });
    return counts;
  }, [entries]);
  const heroCount = summary.streak > 0 ? summary.streak : tabCounts[activeTab] > 0 ? tabCounts[activeTab] : 1;

  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter(item => item !== value) : [...list, value]);
  }

  function handleCalendarMonthChange(next: string) {
    setCalendarMonth(next);
    if (monthKey(selectedDate) !== next) {
      setSelectedDate(`${next}-01`);
      setSelectedEntryKey(null);
    }
  }

  function startNewEntry(nextTab = activeTab, nextDate = selectedDate) {
    setActiveTab(nextTab);
    setSelectedDate(nextDate);
    setSelectedEntryKey(null);
    setDraft('');
    setFollowUp('');
    setMood(3);
    setCta('day');
    setTags([]);
    setDailyType('prompt');
    setLucidity(3);
    setEmotions([]);
    setSymbols([]);
    setShowDetails(nextTab === 'plan' || nextTab === 'note');
  }

  function buildPayload(text: string): JournalEntryPayload {
    return {
      entry_type: activeTab,
      entry_date: selectedDate,
      title: activeTab === 'daily'
        ? DAILY_TYPES.find(type => type.id === dailyType)?.label || 'Daily entry'
        : activeTab === 'dream' ? 'Dream journal'
          : activeTab === 'note' ? 'Field note'
            : activeTab === 'plan' ? 'Flight path'
              : 'Daily check-in',
      text,
      follow_up: activeTab === 'checkin' ? followUp.trim() : '',
      prompt: activeTab === 'daily' ? prompt : '',
      cta: activeTab === 'checkin' ? cta : '',
      mood: activeTab === 'checkin' ? mood : null,
      lucidity: activeTab === 'dream' ? lucidity : null,
      tags: activeTab === 'checkin' || activeTab === 'note' || activeTab === 'plan' ? tags : activeTab === 'dream' ? [...emotions, ...symbols] : [],
      metadata: activeTab === 'daily'
        ? { daily_type: dailyType, word_count: countJournalWords(text) }
        : activeTab === 'dream'
          ? { emotions, symbols }
          : activeTab === 'plan'
            ? { status: 'active', checklist: text.split('\n').map(item => item.trim()).filter(Boolean).slice(0, 20) }
            : activeTab === 'note'
              ? { capture: 'signal' }
              : {},
    };
  }

  async function handleSave() {
    const text = draft.trim();
    if (!text) {
      info('Write a few words first.');
      return;
    }

    const payload = buildPayload(text);

    if (!isAuthenticated) {
      localStorage.setItem(PENDING_KEY, JSON.stringify(payload));
      info('Create a private account to keep this journal safe.');
      onRequireAuth?.();
      return;
    }

    setSaving(true);
    try {
      const saved = currentEntry?.id
        ? await api.update(currentEntry.id, payload)
        : await api.save(payload);
      const remote = normalizeRemoteJournalEntry(saved.entry);
      setRemoteEntries(prev => [remote, ...prev.filter(item => item.id !== remote.id)]);
      setSelectedEntryKey(entryKey(remote));
      mirrorJournalEntryToLocal(saved.entry);
      refreshLocal();
      localStorage.removeItem(PENDING_KEY);
      success(currentEntry?.id ? 'Signal updated in your private universe' : 'Signal saved to your private universe');
      if (activeTab === 'checkin' && payload.mood) {
        setMoodSuggestion({ key: MOOD_INTENTION[payload.mood], mood: payload.mood });
      }
    } catch (err) {
      error((err as Error).message || 'Your journal needs another try before it saves.');
    } finally {
      setSaving(false);
    }
  }

  async function handleImportLocal() {
    if (!unsyncedLocalEntries.length) return;
    setSyncing(true);
    try {
      const result = await api.importEntries(unsyncedLocalEntries.map(memoryEntryToPayload));
      success(`Brought in ${result.count} saved entr${result.count === 1 ? 'y' : 'ies'}`);
      await refreshRemote();
    } catch (err) {
      error((err as Error).message || 'Your older writing needs another try.');
    } finally {
      setSyncing(false);
    }
  }

  const today = todayKey();
  const dateRail = Array.from({ length: 7 }, (_, idx) => offsetDateKey(idx - 6));
  const saveLabel = saving ? 'Saving' : !isAuthenticated ? 'Create account to keep it' : currentEntry ? 'Update signal' : 'Save signal';
  const saveState = !isAuthenticated ? 'Private with an account' : currentEntry ? 'Opened signal' : 'New signal';
  const assistantNudge = activeTab === 'dream'
    ? 'Start with the strongest image you remember. The rest can stay blurry.'
    : activeTab === 'daily'
      ? prompt
      : activeTab === 'note'
        ? 'Catch the signal before it passes. One line is enough.'
        : activeTab === 'plan'
          ? 'Name the orbit. Each line can become one step on the path.'
          : CTA_OPTIONS.find(option => option.id === cta)?.label || 'Begin with one honest sentence.';
  const detailsLabel = activeTab === 'dream' ? 'Dream details' : activeTab === 'daily' ? 'Writing style' : activeTab === 'plan' ? 'Plan path' : activeTab === 'note' ? 'Signal tags' : 'Mood and tags';

  return (
    <div className="dashboard fade-in" style={{ gap: 16 }}>
      <section data-effect="journal-hero" style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 30,
        padding: '20px 18px',
        background: '#17120A',
        color: '#FFFFFF',
        boxShadow: '0 18px 54px rgba(23,18,10,0.22)',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 78% 4%, ${tone(currentMeta.color, '44')}, transparent 32%), radial-gradient(circle at 10% 92%, rgba(12,166,120,0.2), transparent 32%), radial-gradient(circle at 50% 44%, rgba(255,255,255,0.08), transparent 36%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
          <JournalOrb color={currentMeta.color} size={74}>
            <span style={{ fontSize: 19 }}>{heroCount}</span>
          </JournalOrb>
          <div style={{ minWidth: 0, flex: 1 }}>
            <SectionLabel color="rgba(255,255,255,0.62)">Inner universe</SectionLabel>
            <h1 style={{ margin: '5px 0 3px', fontFamily: "'Space Grotesk', sans-serif", fontSize: 30, lineHeight: 1.02, fontWeight: 900, color: '#FFFFFF', letterSpacing: 0 }}>
              Journey log
            </h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.72)', fontSize: 12, lineHeight: 1.5 }}>{formatDate(selectedDate)}</p>
          </div>
          <button
            aria-label="Refresh journal"
            onClick={refreshRemote}
            disabled={!isAuthenticated || loadingRemote}
            title={isAuthenticated ? 'Refresh journal' : 'Create an account to keep entries'}
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.16)',
              background: 'rgba(255,255,255,0.08)',
              color: '#FFFFFF',
              display: 'grid',
              placeItems: 'center',
              opacity: isAuthenticated ? 1 : 0.46,
              flexShrink: 0,
            }}
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 0 1-15.5 6.2" />
              <path d="M3 12A9 9 0 0 1 18.5 5.8" />
              <path d="M18 2v4h4" />
              <path d="M6 22v-4H2" />
            </svg>
          </button>
        </div>

        <p style={{ position: 'relative', margin: '16px 0 0', color: 'rgba(255,255,255,0.72)', fontSize: 12, lineHeight: 1.6 }}>
          Capture journals, field notes, dreams, and flight paths as separate signals, even when they land on the same day.
        </p>
      </section>

      {!isAuthenticated && (
        <section style={{ borderRadius: 24, padding: 15, background: 'linear-gradient(135deg, rgba(112,72,232,0.1), rgba(255,255,255,0.94))', border: '1px solid rgba(112,72,232,0.18)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <JournalOrb color="#7048E8" size={42}>
            <span style={{ fontSize: 13 }}>+</span>
          </JournalOrb>
          <p style={{ margin: 0, color: 'var(--ink2)', fontSize: 12, lineHeight: 1.6 }}>
            Write freely now. When you save, we will help you create a private account so this stays safe and easy to return to.
          </p>
        </section>
      )}

      {isAuthenticated && unsyncedLocalEntries.length > 0 && (
        <section style={{ borderRadius: 24, padding: 15, background: 'rgba(245,159,0,0.09)', border: '1px solid rgba(245,159,0,0.24)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <JournalOrb color="#D97706" size={42}>
            <span style={{ fontSize: 12 }}>{unsyncedLocalEntries.length}</span>
          </JournalOrb>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--ink1)' }}>Older writing found</div>
            <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2 }}>Add it to this account so everything lives together.</div>
          </div>
          <button onClick={handleImportLocal} disabled={syncing} className="btn-primary" style={{ padding: '10px 15px', fontSize: 12, background: '#D97706', boxShadow: '0 6px 16px rgba(217,119,6,0.24)' }}>
            {syncing ? 'Adding' : 'Add'}
          </button>
        </section>
      )}

      <nav aria-label="Journal modes" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(128px, 1fr))', gap: 9 }}>
        {(Object.keys(TAB_META) as JournalTab[]).map(tab => (
          <ModeLens key={tab} tab={tab} active={activeTab === tab} count={tabCounts[tab]} onClick={() => startNewEntry(tab)} />
        ))}
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        <button onClick={() => startNewEntry('daily')} className="btn-primary" style={{ minHeight: 44, background: '#D97706', boxShadow: '0 8px 18px rgba(217,119,6,0.22)' }}>
          New journal
        </button>
        <button onClick={() => startNewEntry('note')} className="btn-primary" style={{ minHeight: 44, background: '#0CA678', boxShadow: '0 8px 18px rgba(12,166,120,0.22)' }}>
          Quick note
        </button>
        <button onClick={() => startNewEntry('plan')} className="btn-primary" style={{ minHeight: 44, background: '#3B5BDB', boxShadow: '0 8px 18px rgba(59,91,219,0.22)' }}>
          Create plan
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '2px 1px 6px' }}>
        {dateRail.map(date => {
          const selected = selectedDate === date;
          const hasEntry = entries.some(entry => entry.entry_date === date && entry.entry_type === activeTab);
          return <DateChip key={date} date={date} selected={selected} hasEntry={hasEntry} color={currentMeta.color} onClick={() => startNewEntry(activeTab, date)} />;
        })}
      </div>

      <CalendarMonth
        month={calendarMonth}
        selectedDate={selectedDate}
        entries={entries}
        activeTab={activeTab}
        onMonthChange={handleCalendarMonthChange}
        onSelectDate={(date) => startNewEntry(activeTab, date)}
        onSelectEntryType={(tab) => startNewEntry(tab)}
      />

      <section data-effect="journal-editor" style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 30,
        padding: 18,
        background: `linear-gradient(145deg, #FFFFFF, ${tone(currentMeta.color, '0C')})`,
        border: `1px solid ${tone(currentMeta.color, '20')}`,
        boxShadow: 'var(--shadow)',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 100% 0%, ${tone(currentMeta.color, '18')}, transparent 34%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <JournalOrb color={currentMeta.color} size={48}>
              <span style={{ fontSize: 12 }}>{activeTab === 'dream' ? lucidity : activeTab === 'checkin' ? mood : countJournalWords(draft)}</span>
            </JournalOrb>
            <div style={{ minWidth: 0 }}>
              <SectionLabel color={currentMeta.color}>{currentMeta.label}</SectionLabel>
              <p style={{ margin: '4px 0 0', color: 'var(--ink3)', fontSize: 12, lineHeight: 1.5 }}>{currentMeta.sub}</p>
            </div>
          </div>
          <span style={{ borderRadius: 999, padding: '7px 10px', background: tone(currentMeta.color, '12'), color: currentMeta.color, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {saveState}
          </span>
        </div>

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section style={{ borderRadius: 22, padding: 14, background: '#FFFFFF', border: `1px solid ${tone(currentMeta.color, '20')}`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <JournalOrb color={currentMeta.color} size={36}>
              <span style={{ fontSize: 12 }}>?</span>
            </JournalOrb>
            <div style={{ minWidth: 0, flex: 1 }}>
              <SectionLabel color={currentMeta.color}>A gentle start</SectionLabel>
              <p style={{ margin: '5px 0 0', color: 'var(--ink2)', fontSize: 13, lineHeight: 1.55 }}>{assistantNudge}</p>
            </div>
          </section>

          <button
            type="button"
            onClick={() => setShowDetails(value => !value)}
            style={{
              height: 44,
              borderRadius: 16,
              border: `1px solid ${tone(currentMeta.color, '24')}`,
              background: showDetails ? tone(currentMeta.color, '10') : '#FFFFFF',
              color: currentMeta.color,
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 12,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span>{showDetails ? 'Hide' : 'Add'} {detailsLabel.toLowerCase()}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s ease' }}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {showDetails && activeTab === 'checkin' && (
            <>
              <section style={{ borderRadius: 22, padding: 14, background: '#FFFFFF', border: '1px solid rgba(23,18,10,0.07)' }}>
                <SectionLabel color="#E64980">Mood</SectionLabel>
                <div style={{ marginTop: 11, display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 7 }}>
                  {MOODS.map(item => (
                    <button
                      aria-pressed={mood === item.value}
                      key={item.value}
                      onClick={() => setMood(item.value)}
                      style={{
                        minHeight: 64,
                        borderRadius: 18,
                        border: `1.5px solid ${mood === item.value ? item.color : 'rgba(23,18,10,0.08)'}`,
                        background: mood === item.value ? tone(item.color, '12') : '#FFFFFF',
                        color: mood === item.value ? item.color : 'var(--ink3)',
                        fontSize: 10,
                        fontWeight: 900,
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      <span style={{ display: 'block', width: 18, height: 18, borderRadius: '50%', margin: '0 auto 7px', background: item.color, boxShadow: `0 0 14px ${tone(item.color, '55')}` }} />
                      {item.label}
                    </button>
                  ))}
                </div>
              </section>

              <section style={{ borderRadius: 22, padding: 14, background: '#FFFFFF', border: '1px solid rgba(23,18,10,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                  <SectionLabel color={currentMeta.color}>Today feels like</SectionLabel>
                  <span style={{ fontSize: 10, color: currentMeta.color, fontWeight: 900 }}>{tags.length} tones</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {CHECKIN_TAGS.map(tag => (
                    <Chip key={tag} active={tags.includes(tag)} color={currentMeta.color} onClick={() => toggle(tags, tag, setTags)}>{tag}</Chip>
                  ))}
                </div>
              </section>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <SectionLabel color={currentMeta.color}>Prompt</SectionLabel>
                <select value={cta} onChange={e => setCta(e.target.value)} style={{ height: 46, borderRadius: 16, background: '#FFFFFF', border: '1.5px solid var(--border)', color: 'var(--ink1)', padding: '0 12px', fontFamily: 'inherit', fontWeight: 800 }}>
                  {CTA_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
              </label>
            </>
          )}

          {showDetails && activeTab === 'daily' && (
            <>
              <section style={{ borderRadius: 22, padding: 14, background: '#FFFFFF', border: '1px solid rgba(23,18,10,0.07)' }}>
                <SectionLabel color="#D97706">Writing mode</SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
                  {DAILY_TYPES.map(type => (
                    <Chip key={type.id} active={dailyType === type.id} color={type.color} onClick={() => setDailyType(type.id)}>{type.label}</Chip>
                  ))}
                </div>
              </section>
            </>
          )}

          {showDetails && (activeTab === 'note' || activeTab === 'plan') && (
            <section style={{ borderRadius: 22, padding: 14, background: '#FFFFFF', border: '1px solid rgba(23,18,10,0.07)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                <SectionLabel color={currentMeta.color}>Signal tags</SectionLabel>
                <span style={{ fontSize: 10, color: currentMeta.color, fontWeight: 900 }}>{tags.length} markers</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {CHECKIN_TAGS.map(tag => (
                  <Chip key={tag} active={tags.includes(tag)} color={currentMeta.color} onClick={() => toggle(tags, tag, setTags)}>{tag}</Chip>
                ))}
              </div>
            </section>
          )}

          {showDetails && activeTab === 'dream' && (
            <>
              <section style={{ borderRadius: 22, padding: 14, background: '#FFFFFF', border: '1px solid rgba(23,18,10,0.07)' }}>
                <SectionLabel color={currentMeta.color}>Lucidity</SectionLabel>
                <div style={{ marginTop: 11, display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(value => (
                    <button
                      aria-pressed={lucidity === value}
                      key={value}
                      onClick={() => setLucidity(value)}
                      style={{
                        height: 48,
                        borderRadius: '50%',
                        border: `1.5px solid ${lucidity === value ? currentMeta.color : 'rgba(23,18,10,0.08)'}`,
                        background: lucidity === value ? `radial-gradient(circle at 35% 30%, #FFFFFF, ${currentMeta.color} 62%)` : '#FFFFFF',
                        color: lucidity === value ? '#FFFFFF' : currentMeta.color,
                        fontWeight: 900,
                        boxShadow: lucidity === value ? `0 0 18px ${tone(currentMeta.color, '42')}` : 'none',
                      }}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </section>
              <section style={{ borderRadius: 22, padding: 14, background: '#FFFFFF', border: '1px solid rgba(23,18,10,0.07)' }}>
                <SectionLabel color={currentMeta.color}>Emotions</SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
                  {DREAM_EMOTIONS.map(item => <Chip key={item} active={emotions.includes(item)} color={currentMeta.color} onClick={() => toggle(emotions, item, setEmotions)}>{item}</Chip>)}
                </div>
              </section>
              <section style={{ borderRadius: 22, padding: 14, background: '#FFFFFF', border: '1px solid rgba(23,18,10,0.07)' }}>
                <SectionLabel color={currentMeta.color}>Symbols</SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
                  {DREAM_SYMBOLS.map(item => <Chip key={item} active={symbols.includes(item)} color={currentMeta.color} onClick={() => toggle(symbols, item, setSymbols)}>{item}</Chip>)}
                </div>
              </section>
            </>
          )}

          <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SectionLabel color={currentMeta.color}>{activeTab === 'dream' ? 'Dream notes' : activeTab === 'note' ? 'Field note' : activeTab === 'plan' ? 'Flight path' : 'Reflection'}</SectionLabel>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={activeTab === 'daily' || activeTab === 'plan' ? 8 : 6}
              placeholder={activeTab === 'dream' ? 'Write the image, feeling, place, or fragment...' : activeTab === 'note' ? 'Capture a quick signal, thought, idea, or observation...' : activeTab === 'plan' ? 'One step per line. Let this become a path you can return to...' : 'Begin anywhere. A few honest words are enough.'}
              style={{
                resize: 'vertical',
                minHeight: activeTab === 'daily' || activeTab === 'plan' ? 190 : 146,
                borderRadius: 22,
                lineHeight: 1.75,
                padding: 15,
                border: `1.5px solid ${tone(currentMeta.color, '2A')}`,
                background: 'rgba(255,255,255,0.92)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
              }}
            />
          </label>

          {showDetails && activeTab === 'checkin' && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SectionLabel color={currentMeta.color}>Follow-up</SectionLabel>
              <textarea
                value={followUp}
                onChange={e => setFollowUp(e.target.value)}
                rows={3}
                placeholder="What would support you after writing this?"
                style={{ resize: 'vertical', minHeight: 92, borderRadius: 20, lineHeight: 1.7, padding: 14, border: '1.5px solid var(--border)', background: '#FFFFFF' }}
              />
            </label>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: currentMeta.color, boxShadow: `0 0 12px ${tone(currentMeta.color, '65')}`, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'var(--ink3)', fontFamily: "'JetBrains Mono', monospace" }}>{countJournalWords(draft)} words</span>
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ minWidth: 158, height: 46, background: `linear-gradient(135deg, ${currentMeta.color}, #3B5BDB)`, boxShadow: `0 10px 22px ${tone(currentMeta.color, '30')}` }}>
              {saveLabel}
            </button>
          </div>
        </div>
      </section>

      {moodSuggestion && (() => {
        const intention = INTENTIONS[moodSuggestion.key];
        const moodMeta = MOODS.find(m => m.value === moodSuggestion.mood);
        return (
          <section className="fade-in" data-effect="journal-mood" style={{
            borderRadius: 24, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14,
            background: `linear-gradient(135deg, ${tone(moodMeta?.color || '#7048E8', '14')}, ${tone('#3B5BDB', '10')})`,
            border: `1px solid ${tone(moodMeta?.color || '#7048E8', '30')}`,
          }}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>{intention.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink1)' }}>
                Feeling {moodMeta?.label.toLowerCase()}? Try a {intention.label} session
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2 }}>Tuned music picks up where your check-in left off.</div>
            </div>
            <button
              onClick={() => {
                engine.applyIntention(moodSuggestion.key);
                if (!engine.isPlaying) engine.start();
                setMoodSuggestion(null);
                onTabChange?.('journey');
              }}
              className="btn-primary" style={{ flexShrink: 0, padding: '9px 16px', fontSize: 12 }}
            >
              Start
            </button>
            <button onClick={() => setMoodSuggestion(null)} aria-label="Dismiss" style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink4)', fontSize: 14, flexShrink: 0, padding: 4,
            }}>x</button>
          </section>
        );
      })()}

      <section data-effect="journal-history" style={{ borderRadius: 30, padding: 18, background: '#FFFFFF', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <SectionLabel color={currentMeta.color}>Saved signals</SectionLabel>
            <p style={{ margin: '4px 0 0', color: 'var(--ink3)', fontSize: 12 }}>{currentMeta.label} constellation</p>
          </div>
          {loadingRemote && <span style={{ fontSize: 11, color: 'var(--ink3)' }}>Gathering...</span>}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`Search your ${currentMeta.label.toLowerCase()}`}
          style={{ height: 44, borderRadius: 16, padding: '0 13px', border: '1.5px solid var(--border)' }}
        />

        {filteredHistory.length === 0 ? (
          <div style={{ borderRadius: 24, border: `1px dashed ${tone(currentMeta.color, '35')}`, padding: 24, textAlign: 'center', color: 'var(--ink3)', fontSize: 13, lineHeight: 1.7, background: tone(currentMeta.color, '08') }}>
            {isAuthenticated ? `No ${currentMeta.label.toLowerCase()} signals yet.` : 'Create an account to keep a private journal history.'}
          </div>
        ) : (
          <div className={search.trim() ? '' : 'stagger-list'} style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {filteredHistory.slice(0, 12).map(entry => {
              const meta = TAB_META[entry.entry_type];
              return (
                <button
                  key={`${entry.entry_type}-${entry.entry_date}-${entry.id || 'local'}`}
                  onClick={() => { setActiveTab(entry.entry_type); setSelectedDate(entry.entry_date); setSelectedEntryKey(entryKey(entry)); }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    display: 'grid',
                    gridTemplateColumns: '42px minmax(0, 1fr) auto',
                    alignItems: 'center',
                    gap: 12,
                    padding: '13px 14px',
                    borderRadius: 22,
                    border: `1px solid ${tone(meta.color, '1D')}`,
                    background: `linear-gradient(180deg, #FFFFFF, ${tone(meta.color, '08')})`,
                    boxShadow: '0 4px 14px rgba(23,18,10,0.045)',
                  }}
                >
                  <JournalOrb color={meta.color} size={34}>
                    <span style={{ fontSize: 9 }}>{entry.entry_type === 'checkin' ? entry.mood ?? '-' : entry.entry_type === 'dream' ? entry.lucidity ?? '-' : entry.entry_type === 'plan' ? 'GO' : entry.entry_type === 'note' ? 'N' : countJournalWords(entry.text || '')}</span>
                  </JournalOrb>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--ink1)', fontFamily: "'Space Grotesk', sans-serif" }}>{formatDate(entry.entry_date, 'short')}</span>
                      <span style={{ fontSize: 10, color: meta.color, fontWeight: 900, textTransform: 'uppercase' }}>{meta.label}</span>
                    </span>
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--ink3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {previewText(entry.text, entry.title)}
                    </span>
                  </span>
                  <span style={{ borderRadius: 999, padding: '6px 8px', background: entry.source === 'remote' ? 'rgba(12,166,120,0.1)' : 'rgba(217,119,6,0.1)', color: entry.source === 'remote' ? '#0CA678' : '#D97706', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    {entry.source === 'remote' ? 'Saved' : 'On device'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
