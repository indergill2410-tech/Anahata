import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
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
};

const PENDING_KEY = 'anahata_pending_journal';

const TAB_META: Record<JournalTab, { label: string; color: string; sub: string }> = {
  checkin: { label: 'Check-in', color: '#7048E8', sub: 'Mood, tags, and one honest reflection.' },
  daily: { label: 'Daily', color: '#D97706', sub: 'A deeper page for the day.' },
  dream: { label: 'Dreams', color: '#6366F1', sub: 'Capture dream fragments before they fade.' },
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
  return a.entry_type === b.entry_type && a.entry_date === b.entry_date;
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

function SignalPill({ label, value, color, dark = false }: { label: string; value: string | number; color: string; dark?: boolean }) {
  return (
    <div style={{
      minWidth: 0,
      borderRadius: 18,
      padding: '12px 10px',
      background: dark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
      border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : tone(color, '1F')}`,
      boxShadow: dark ? 'none' : '0 6px 18px rgba(23,18,10,0.045)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 16px ${tone(color, '66')}`, flexShrink: 0 }} />
        <span style={{ color: dark ? 'rgba(255,255,255,0.62)' : 'var(--ink3)', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ color: dark ? '#FFFFFF' : 'var(--ink1)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 21, lineHeight: 1, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </div>
    </div>
  );
}

function ModeLens({ tab, active, count, onClick }: { tab: JournalTab; active: boolean; count: number; onClick: () => void }) {
  const meta = TAB_META[tab];
  return (
    <button
      aria-pressed={active}
      onClick={onClick}
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
    </button>
  );
}

function DateChip({ date, selected, hasEntry, color, onClick }: { date: string; selected: boolean; hasEntry: boolean; color: string; onClick: () => void }) {
  const isToday = date === todayKey();
  return (
    <button
      aria-pressed={selected}
      onClick={onClick}
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
    </button>
  );
}

export default function JournalPage({ onRequireAuth }: JournalPageProps) {
  const { isAuthenticated, authFetch } = useAuth();
  const { success, error, info } = useToast();
  const initialPending = useMemo(() => readPendingDraft(), []);
  const skipHydrateRef = useRef(Boolean(initialPending));
  const api = useMemo(() => createJournalApi(authFetch), [authFetch]);

  const [activeTab, setActiveTab] = useState<JournalTab>(initialPending?.entry_type || 'checkin');
  const [selectedDate, setSelectedDate] = useState(initialPending?.entry_date || todayKey());
  const [localEntries, setLocalEntries] = useState<JournalMemoryEntry[]>(() => readLocalJournalEntries());
  const [remoteEntries, setRemoteEntries] = useState<JournalMemoryEntry[]>([]);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');

  const [draft, setDraft] = useState(initialPending?.text || '');
  const [followUp, setFollowUp] = useState(initialPending?.follow_up || '');
  const [mood, setMood] = useState(initialPending?.mood || 3);
  const [cta, setCta] = useState(initialPending?.cta || 'day');
  const [tags, setTags] = useState<string[]>(cleanJournalTags(initialPending?.tags));
  const [dailyType, setDailyType] = useState(typeof initialPending?.metadata?.daily_type === 'string' ? initialPending.metadata.daily_type : 'prompt');
  const [lucidity, setLucidity] = useState(initialPending?.lucidity || 3);
  const [emotions, setEmotions] = useState<string[]>(cleanJournalTags(initialPending?.metadata?.emotions));
  const [symbols, setSymbols] = useState<string[]>(cleanJournalTags(initialPending?.metadata?.symbols));

  const entries = isAuthenticated ? remoteEntries : localEntries;
  const summary = useMemo(() => summarizeJournalEntries(entries), [entries]);
  const currentEntry = entries.find(entry => entry.entry_type === activeTab && entry.entry_date === selectedDate);
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
      error((err as Error).message || 'Could not load journal');
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
    if (skipHydrateRef.current) {
      skipHydrateRef.current = false;
      return;
    }
    setDraft(currentEntry?.text || '');
    setFollowUp(currentEntry?.follow_up || '');
    setMood(currentEntry?.mood || 3);
    setCta(currentEntry?.cta || 'day');
    setTags(currentEntry?.tags || []);
    setDailyType(typeof currentEntry?.metadata.daily_type === 'string' ? currentEntry.metadata.daily_type : 'prompt');
    setLucidity(currentEntry?.lucidity || 3);
    setEmotions(cleanJournalTags(currentEntry?.metadata.emotions));
    setSymbols(cleanJournalTags(currentEntry?.metadata.symbols));
  }, [activeTab, currentEntry?.id, currentEntry?.entry_date, currentEntry?.entry_type, selectedDate]);

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
    const counts: Record<JournalTab, number> = { checkin: 0, daily: 0, dream: 0 };
    entries.forEach(entry => { counts[entry.entry_type] += 1; });
    return counts;
  }, [entries]);

  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter(item => item !== value) : [...list, value]);
  }

  function buildPayload(text: string): JournalEntryPayload {
    return {
      entry_type: activeTab,
      entry_date: selectedDate,
      title: activeTab === 'daily'
        ? DAILY_TYPES.find(type => type.id === dailyType)?.label || 'Daily entry'
        : activeTab === 'dream' ? 'Dream journal' : 'Daily check-in',
      text,
      follow_up: activeTab === 'checkin' ? followUp.trim() : '',
      prompt: activeTab === 'daily' ? prompt : '',
      cta: activeTab === 'checkin' ? cta : '',
      mood: activeTab === 'checkin' ? mood : null,
      lucidity: activeTab === 'dream' ? lucidity : null,
      tags: activeTab === 'checkin' ? tags : activeTab === 'dream' ? [...emotions, ...symbols] : [],
      metadata: activeTab === 'daily'
        ? { daily_type: dailyType, word_count: countJournalWords(text) }
        : activeTab === 'dream'
          ? { emotions, symbols }
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
      info('Create an account to save this journal to your dashboard.');
      onRequireAuth?.();
      return;
    }

    setSaving(true);
    try {
      const saved = await api.save(payload);
      const remote = normalizeRemoteJournalEntry(saved.entry);
      setRemoteEntries(prev => [remote, ...prev.filter(item => !sameEntry(item, remote))]);
      mirrorJournalEntryToLocal(saved.entry);
      refreshLocal();
      localStorage.removeItem(PENDING_KEY);
      success('Journal saved to your dashboard');
    } catch (err) {
      error((err as Error).message || 'Could not save journal');
    } finally {
      setSaving(false);
    }
  }

  async function handleImportLocal() {
    if (!unsyncedLocalEntries.length) return;
    setSyncing(true);
    try {
      const result = await api.importEntries(unsyncedLocalEntries.map(memoryEntryToPayload));
      success(`Synced ${result.count} local entr${result.count === 1 ? 'y' : 'ies'}`);
      await refreshRemote();
    } catch (err) {
      error((err as Error).message || 'Could not sync local entries');
    } finally {
      setSyncing(false);
    }
  }

  const today = todayKey();
  const dateRail = Array.from({ length: 7 }, (_, idx) => offsetDateKey(idx - 6));
  const saveLabel = saving ? 'Saving' : isAuthenticated ? currentEntry ? 'Update memory' : 'Save memory' : 'Create account to save';
  const saveState = isAuthenticated ? currentEntry ? 'Saved to dashboard' : 'Ready for dashboard' : 'Private after sign in';

  return (
    <div className="dashboard fade-in" style={{ gap: 16 }}>
      <section style={{
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
            <span style={{ fontSize: 19 }}>{summary.streak || tabCounts[activeTab] || 1}</span>
          </JournalOrb>
          <div style={{ minWidth: 0, flex: 1 }}>
            <SectionLabel color="rgba(255,255,255,0.62)">Private memory</SectionLabel>
            <h1 style={{ margin: '5px 0 3px', fontFamily: "'Space Grotesk', sans-serif", fontSize: 30, lineHeight: 1.02, fontWeight: 900, color: '#FFFFFF', letterSpacing: 0 }}>
              Journal
            </h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.72)', fontSize: 12, lineHeight: 1.5 }}>{formatDate(selectedDate)}</p>
          </div>
          <button
            aria-label="Refresh journal"
            onClick={refreshRemote}
            disabled={!isAuthenticated || loadingRemote}
            title={isAuthenticated ? 'Refresh journal' : 'Sign in to sync'}
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

        <div style={{ position: 'relative', marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
          <SignalPill label="Entries" value={summary.totalEntries} color="#7048E8" dark />
          <SignalPill label="Streak" value={`${summary.streak}d`} color="#F59F00" dark />
          <SignalPill label="Words" value={summary.totalWords} color="#0CA678" dark />
        </div>
      </section>

      {!isAuthenticated && (
        <section style={{ borderRadius: 24, padding: 15, background: 'linear-gradient(135deg, rgba(112,72,232,0.1), rgba(255,255,255,0.94))', border: '1px solid rgba(112,72,232,0.18)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <JournalOrb color="#7048E8" size={42}>
            <span style={{ fontSize: 13 }}>+</span>
          </JournalOrb>
          <p style={{ margin: 0, color: 'var(--ink2)', fontSize: 12, lineHeight: 1.6 }}>
            Write now. Saving asks for an account so this becomes private dashboard memory.
          </p>
        </section>
      )}

      {isAuthenticated && unsyncedLocalEntries.length > 0 && (
        <section style={{ borderRadius: 24, padding: 15, background: 'rgba(245,159,0,0.09)', border: '1px solid rgba(245,159,0,0.24)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <JournalOrb color="#D97706" size={42}>
            <span style={{ fontSize: 12 }}>{unsyncedLocalEntries.length}</span>
          </JournalOrb>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--ink1)' }}>Local entr{unsyncedLocalEntries.length === 1 ? 'y' : 'ies'} ready</div>
            <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2 }}>Bring older writing into this account.</div>
          </div>
          <button onClick={handleImportLocal} disabled={syncing} className="btn-primary" style={{ padding: '10px 15px', fontSize: 12, background: '#D97706', boxShadow: '0 6px 16px rgba(217,119,6,0.24)' }}>
            {syncing ? 'Syncing' : 'Sync'}
          </button>
        </section>
      )}

      <nav aria-label="Journal modes" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 9 }}>
        {(Object.keys(TAB_META) as JournalTab[]).map(tab => (
          <ModeLens key={tab} tab={tab} active={activeTab === tab} count={tabCounts[tab]} onClick={() => setActiveTab(tab)} />
        ))}
      </nav>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '2px 1px 6px' }}>
        {dateRail.map(date => {
          const selected = selectedDate === date;
          const hasEntry = entries.some(entry => entry.entry_date === date && entry.entry_type === activeTab);
          return <DateChip key={date} date={date} selected={selected} hasEntry={hasEntry} color={currentMeta.color} onClick={() => setSelectedDate(date)} />;
        })}
      </div>

      <section style={{
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
          {activeTab === 'checkin' && (
            <>
              <section style={{ borderRadius: 22, padding: 14, background: '#FFFFFF', border: '1px solid rgba(23,18,10,0.07)' }}>
                <SectionLabel color="#E64980">Mood orbit</SectionLabel>
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
                  <SectionLabel color={currentMeta.color}>Today feels</SectionLabel>
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

          {activeTab === 'daily' && (
            <>
              <section style={{ borderRadius: 24, padding: 16, background: '#17120A', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 14px 34px rgba(23,18,10,0.16)' }}>
                <SectionLabel color="rgba(245,159,0,0.78)">Daily reflection</SectionLabel>
                <div style={{ marginTop: 10, fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 900, lineHeight: 1.42 }}>{prompt}</div>
              </section>
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

          {activeTab === 'dream' && (
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
            <SectionLabel color={currentMeta.color}>{activeTab === 'dream' ? 'Dream notes' : 'Reflection'}</SectionLabel>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={activeTab === 'daily' ? 8 : 6}
              placeholder={activeTab === 'dream' ? 'Write the image, feeling, place, or fragment...' : 'Begin anywhere. A few honest words are enough.'}
              style={{
                resize: 'vertical',
                minHeight: activeTab === 'daily' ? 190 : 146,
                borderRadius: 22,
                lineHeight: 1.75,
                padding: 15,
                border: `1.5px solid ${tone(currentMeta.color, '2A')}`,
                background: 'rgba(255,255,255,0.92)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
              }}
            />
          </label>

          {activeTab === 'checkin' && (
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

      <section style={{ borderRadius: 30, padding: 18, background: '#FFFFFF', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <SectionLabel color={currentMeta.color}>Memory stream</SectionLabel>
            <p style={{ margin: '4px 0 0', color: 'var(--ink3)', fontSize: 12 }}>{currentMeta.label} archive</p>
          </div>
          {loadingRemote && <span style={{ fontSize: 11, color: 'var(--ink3)' }}>Loading...</span>}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`Search ${currentMeta.label.toLowerCase()} entries`}
          style={{ height: 44, borderRadius: 16, padding: '0 13px', border: '1.5px solid var(--border)' }}
        />

        {filteredHistory.length === 0 ? (
          <div style={{ borderRadius: 24, border: `1px dashed ${tone(currentMeta.color, '35')}`, padding: 24, textAlign: 'center', color: 'var(--ink3)', fontSize: 13, lineHeight: 1.7, background: tone(currentMeta.color, '08') }}>
            {isAuthenticated ? `No ${currentMeta.label.toLowerCase()} memories yet.` : 'Sign in to start saving a private journal archive.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {filteredHistory.slice(0, 12).map(entry => {
              const meta = TAB_META[entry.entry_type];
              return (
                <button
                  key={`${entry.entry_type}-${entry.entry_date}-${entry.id || 'local'}`}
                  onClick={() => { setActiveTab(entry.entry_type); setSelectedDate(entry.entry_date); }}
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
                    <span style={{ fontSize: 9 }}>{entry.entry_type === 'checkin' ? entry.mood : entry.entry_type === 'dream' ? entry.lucidity : countJournalWords(entry.text)}</span>
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
                    {entry.source === 'remote' ? 'Saved' : 'Local'}
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
