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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink3)', fontFamily: "'Space Grotesk', sans-serif" }}>
      {children}
    </div>
  );
}

function Chip({ active, color, children, onClick }: { active: boolean; color: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: `1.5px solid ${active ? color : 'rgba(23,18,10,0.08)'}`,
        background: active ? tone(color, '12') : '#FFFFFF',
        color: active ? color : 'var(--ink2)',
        borderRadius: 999,
        padding: '7px 13px',
        fontSize: 12,
        fontWeight: 900,
        fontFamily: "'Space Grotesk', sans-serif",
        boxShadow: active ? `0 4px 14px ${tone(color, '24')}` : '0 1px 6px rgba(23,18,10,0.04)',
      }}
    >
      {children}
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

  const dateRail = Array.from({ length: 7 }, (_, idx) => offsetDateKey(idx - 6));

  return (
    <div className="dashboard fade-in" style={{ gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 27, fontWeight: 900, color: 'var(--ink1)', letterSpacing: '0' }}>
            Journal
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ink3)' }}>{formatDate(selectedDate)}</p>
        </div>
        <button
          onClick={refreshRemote}
          disabled={!isAuthenticated || loadingRemote}
          title={isAuthenticated ? 'Refresh journal' : 'Sign in to sync'}
          style={{
            height: 38,
            minWidth: 38,
            borderRadius: 12,
            border: '1px solid var(--border)',
            background: '#FFFFFF',
            color: currentMeta.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isAuthenticated ? 1 : 0.45,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 0 1-15.5 6.2" />
            <path d="M3 12A9 9 0 0 1 18.5 5.8" />
            <path d="M18 2v4h4" />
            <path d="M6 22v-4H2" />
          </svg>
        </button>
      </div>

      <div className="card" style={{ padding: 16, borderRadius: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink1)', fontFamily: "'Space Grotesk', sans-serif" }}>{summary.totalEntries}</div>
          <div style={{ fontSize: 10, color: 'var(--ink3)', fontWeight: 800 }}>Entries</div>
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#F59F00', fontFamily: "'Space Grotesk', sans-serif" }}>{summary.streak}</div>
          <div style={{ fontSize: 10, color: 'var(--ink3)', fontWeight: 800 }}>Day streak</div>
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: currentMeta.color, fontFamily: "'Space Grotesk', sans-serif" }}>{summary.totalWords}</div>
          <div style={{ fontSize: 10, color: 'var(--ink3)', fontWeight: 800 }}>Words</div>
        </div>
      </div>

      {!isAuthenticated && (
        <div style={{ borderRadius: 18, padding: '13px 15px', background: 'rgba(112,72,232,0.07)', border: '1px solid rgba(112,72,232,0.16)', color: 'var(--ink2)', fontSize: 12, lineHeight: 1.65 }}>
          You can write here now. When you save, Anahata will ask you to create or sign in to an account so this entry joins your private dashboard.
        </div>
      )}

      {isAuthenticated && unsyncedLocalEntries.length > 0 && (
        <div style={{ borderRadius: 18, padding: 14, background: 'rgba(245,159,0,0.08)', border: '1px solid rgba(245,159,0,0.22)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--ink1)' }}>{unsyncedLocalEntries.length} local entr{unsyncedLocalEntries.length === 1 ? 'y' : 'ies'} ready to sync</div>
            <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2 }}>Bring older device-only writing into this account.</div>
          </div>
          <button onClick={handleImportLocal} disabled={syncing} className="btn-primary" style={{ padding: '10px 16px', fontSize: 12, boxShadow: '0 4px 14px rgba(245,159,0,0.25)', background: '#D97706' }}>
            {syncing ? 'Syncing' : 'Sync'}
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
        {(Object.keys(TAB_META) as JournalTab[]).map(tab => {
          const meta = TAB_META[tab];
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                height: 48,
                borderRadius: 16,
                border: `1.5px solid ${active ? meta.color : 'rgba(23,18,10,0.08)'}`,
                background: active ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
                color: active ? meta.color : 'var(--ink3)',
                boxShadow: active ? `0 5px 18px ${tone(meta.color, '24')}` : 'none',
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2 }}>
        {dateRail.map(date => {
          const selected = selectedDate === date;
          const hasEntry = entries.some(entry => entry.entry_date === date && entry.entry_type === activeTab);
          return (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              style={{
                flex: '0 0 auto',
                minWidth: 66,
                height: 48,
                borderRadius: 15,
                border: `1.5px solid ${selected ? currentMeta.color : 'rgba(23,18,10,0.07)'}`,
                background: selected ? tone(currentMeta.color, '10') : '#FFFFFF',
                color: selected ? currentMeta.color : 'var(--ink2)',
                fontSize: 11,
                fontWeight: 900,
                fontFamily: "'Space Grotesk', sans-serif",
                position: 'relative',
              }}
            >
              {date === todayKey() ? 'Today' : formatDate(date, 'short')}
              {hasEntry && <span style={{ position: 'absolute', left: '50%', bottom: 6, width: 4, height: 4, borderRadius: '50%', transform: 'translateX(-50%)', background: currentMeta.color }} />}
            </button>
          );
        })}
      </div>

      <div className="card" style={{ padding: 18, borderRadius: 22, display: 'flex', flexDirection: 'column', gap: 15 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <SectionLabel>{currentMeta.label}</SectionLabel>
            <p style={{ margin: '5px 0 0', color: 'var(--ink3)', fontSize: 12 }}>{currentMeta.sub}</p>
          </div>
          <span style={{ padding: '5px 10px', borderRadius: 999, background: tone(currentMeta.color, '10'), color: currentMeta.color, fontSize: 10, fontWeight: 900 }}>
            {isAuthenticated ? 'Dashboard save' : 'Account required'}
          </span>
        </div>

        {activeTab === 'checkin' && (
          <>
            <SectionLabel>Mood</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {MOODS.map(item => (
                <button
                  key={item.value}
                  onClick={() => setMood(item.value)}
                  style={{
                    minHeight: 58,
                    borderRadius: 15,
                    border: `1.5px solid ${mood === item.value ? item.color : 'rgba(23,18,10,0.08)'}`,
                    background: mood === item.value ? tone(item.color, '12') : '#FFFFFF',
                    color: mood === item.value ? item.color : 'var(--ink3)',
                    fontSize: 10,
                    fontWeight: 900,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  <span style={{ display: 'block', width: 16, height: 16, borderRadius: '50%', margin: '0 auto 6px', background: item.color, boxShadow: `0 0 12px ${tone(item.color, '55')}` }} />
                  {item.label}
                </button>
              ))}
            </div>

            <SectionLabel>Today feels</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {CHECKIN_TAGS.map(tag => (
                <Chip key={tag} active={tags.includes(tag)} color={currentMeta.color} onClick={() => toggle(tags, tag, setTags)}>{tag}</Chip>
              ))}
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SectionLabel>Prompt</SectionLabel>
              <select value={cta} onChange={e => setCta(e.target.value)} style={{ height: 44, borderRadius: 14, background: '#FFFFFF', border: '1.5px solid var(--border)', color: 'var(--ink1)', padding: '0 12px', fontFamily: 'inherit' }}>
                {CTA_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
            </label>
          </>
        )}

        {activeTab === 'daily' && (
          <>
            <div style={{ borderRadius: 18, padding: 16, background: '#17120A', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(245,159,0,0.75)', marginBottom: 8 }}>Daily reflection</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 900, lineHeight: 1.4 }}>{prompt}</div>
            </div>
            <SectionLabel>Writing mode</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {DAILY_TYPES.map(type => (
                <Chip key={type.id} active={dailyType === type.id} color={type.color} onClick={() => setDailyType(type.id)}>{type.label}</Chip>
              ))}
            </div>
          </>
        )}

        {activeTab === 'dream' && (
          <>
            <SectionLabel>Lucidity</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 7 }}>
              {[1, 2, 3, 4, 5].map(value => (
                <button
                  key={value}
                  onClick={() => setLucidity(value)}
                  style={{
                    height: 44,
                    borderRadius: 14,
                    border: `1.5px solid ${lucidity === value ? currentMeta.color : 'rgba(23,18,10,0.08)'}`,
                    background: lucidity === value ? tone(currentMeta.color, '12') : '#FFFFFF',
                    color: lucidity === value ? currentMeta.color : 'var(--ink3)',
                    fontWeight: 900,
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
            <SectionLabel>Emotions</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {DREAM_EMOTIONS.map(item => <Chip key={item} active={emotions.includes(item)} color={currentMeta.color} onClick={() => toggle(emotions, item, setEmotions)}>{item}</Chip>)}
            </div>
            <SectionLabel>Symbols</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {DREAM_SYMBOLS.map(item => <Chip key={item} active={symbols.includes(item)} color={currentMeta.color} onClick={() => toggle(symbols, item, setSymbols)}>{item}</Chip>)}
            </div>
          </>
        )}

        <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SectionLabel>{activeTab === 'dream' ? 'Dream notes' : 'Reflection'}</SectionLabel>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={activeTab === 'daily' ? 7 : 5}
            placeholder={activeTab === 'dream' ? 'Write the image, feeling, place, or fragment...' : 'Begin anywhere. A few honest words are enough.'}
            style={{ resize: 'vertical', minHeight: 132, borderRadius: 17, lineHeight: 1.75 }}
          />
        </label>

        {activeTab === 'checkin' && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SectionLabel>Follow-up</SectionLabel>
            <textarea
              value={followUp}
              onChange={e => setFollowUp(e.target.value)}
              rows={3}
              placeholder="What would support you after writing this?"
              style={{ resize: 'vertical', minHeight: 88, borderRadius: 17, lineHeight: 1.7 }}
            />
          </label>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 2 }}>
          <span style={{ fontSize: 11, color: 'var(--ink3)', fontFamily: "'JetBrains Mono', monospace" }}>{countJournalWords(draft)} words</span>
          <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ minWidth: 150, height: 44, background: `linear-gradient(135deg, ${currentMeta.color}, #3B5BDB)` }}>
            {saving ? 'Saving' : isAuthenticated ? currentEntry ? 'Update entry' : 'Save entry' : 'Create account to save'}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 16, borderRadius: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <SectionLabel>History</SectionLabel>
          {loadingRemote && <span style={{ fontSize: 11, color: 'var(--ink3)' }}>Loading...</span>}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`Search ${currentMeta.label.toLowerCase()} entries`}
          style={{ height: 42, borderRadius: 14 }}
        />

        {filteredHistory.length === 0 ? (
          <div style={{ borderRadius: 18, border: '1px dashed rgba(23,18,10,0.14)', padding: 22, textAlign: 'center', color: 'var(--ink3)', fontSize: 13, lineHeight: 1.7 }}>
            {isAuthenticated ? `No ${currentMeta.label.toLowerCase()} entries yet. Save one above and this space will become your archive.` : 'Sign in to start saving a private journal archive.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredHistory.slice(0, 12).map(entry => (
              <button
                key={`${entry.entry_type}-${entry.entry_date}-${entry.id || 'local'}`}
                onClick={() => { setActiveTab(entry.entry_type); setSelectedDate(entry.entry_date); }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '13px 14px',
                  borderRadius: 17,
                  border: '1px solid rgba(23,18,10,0.07)',
                  background: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(23,18,10,0.04)',
                }}
              >
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: TAB_META[entry.entry_type].color, boxShadow: `0 0 12px ${tone(TAB_META[entry.entry_type].color, '45')}`, flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 900, color: 'var(--ink1)', fontFamily: "'Space Grotesk', sans-serif" }}>{formatDate(entry.entry_date, 'short')}</span>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--ink3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {entry.text || entry.title || 'Untitled entry'}
                  </span>
                </span>
                <span style={{ fontSize: 10, color: entry.source === 'remote' ? '#0CA678' : '#D97706', fontWeight: 900, textTransform: 'uppercase' }}>
                  {entry.source === 'remote' ? 'Saved' : 'Local'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
