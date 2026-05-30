import React, { useState, useEffect, useRef, useCallback } from 'react';
import AnahataOrb, { OrbId } from '../components/AnahataOrb';

// ─── Types ────────────────────────────────────────────────────────────────────
interface JournalEntry {
  date: string;
  mood: number;
  text: string;
  sessionBw?: string;
  sessionMin?: number;
  sessionHz?: number;
  tags: string[];
}

type JournalStore = Record<string, JournalEntry>;

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'anahata_journal';

const MOOD_CONFIG = [
  { value: 1, emoji: '😔', label: 'Rough',   color: '#E64980', orbId: 'mood-rough'    as OrbId },
  { value: 2, emoji: '😐', label: 'Okay',    color: '#F59F00', orbId: 'mood-okay'     as OrbId },
  { value: 3, emoji: '🙂', label: 'Good',    color: '#0CA678', orbId: 'mood-good'     as OrbId },
  { value: 4, emoji: '😊', label: 'Great',   color: '#3B5BDB', orbId: 'mood-great'    as OrbId },
  { value: 5, emoji: '🤩', label: 'Blissful',color: '#7048E8', orbId: 'mood-blissful' as OrbId },
];

const PRESET_TAGS = ['calm','focused','grateful','restless','anxious','peaceful','energised','creative','tired','inspired'];

const BW_COLORS: Record<string, string> = {
  Delta: '#7048E8', Theta: '#3B5BDB', Alpha: '#0CA678',
  Beta: '#F59F00', Gamma: '#E64980',
};

const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toKey(y: number, m: number, d: number) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function todayKey() {
  const n = new Date();
  return toKey(n.getFullYear(), n.getMonth(), n.getDate());
}

function loadStore(): JournalStore {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

function saveStore(store: JournalStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function calcStreak(store: JournalStore): number {
  let streak = 0;
  const cur = new Date();
  cur.setHours(0,0,0,0);
  while (true) {
    const k = toKey(cur.getFullYear(), cur.getMonth(), cur.getDate());
    if (store[k]) { streak++; cur.setDate(cur.getDate()-1); }
    else break;
  }
  return streak;
}

function formatDateLabel(dateStr: string) {
  const [y,m,d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m-1, d);
  return dt.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month+1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MoodDot({ mood, size = 10 }: { mood: number; size?: number }) {
  const cfg = MOOD_CONFIG.find(m => m.value === mood);
  if (!cfg) return null;
  return <span style={{ display:'inline-block', width:size, height:size, borderRadius:'50%', background:cfg.color, flexShrink:0 }} />;
}

interface CalendarProps {
  year: number;
  month: number;
  store: JournalStore;
  selectedDate: string;
  onSelect: (date: string) => void;
}

function Calendar({ year, month, store, selectedDate, onSelect }: CalendarProps) {
  const today = todayKey();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ padding: '0 20px' }}>
      {/* Day headers */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:6 }}>
        {DAYS_SHORT.map(d => (
          <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:600, color:'#C2B5A3', fontFamily:"'Plus Jakarta Sans', sans-serif", paddingBottom:4 }}>
            {d[0]}
          </div>
        ))}
      </div>
      {/* Day cells */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'4px 0' }}>
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} />;
          const key = toKey(year, month, day);
          const entry = store[key];
          const isToday = key === today;
          const isSelected = key === selectedDate;
          const mood = entry?.mood;
          const moodColor = mood ? MOOD_CONFIG[mood-1].color : undefined;
          const hasSession = !!(entry?.sessionBw);

          return (
            <div
              key={key}
              onClick={() => onSelect(key)}
              style={{
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                gap: 2, padding:'4px 0', cursor:'pointer', position:'relative',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:"'Plus Jakarta Sans', sans-serif", fontSize:13, fontWeight: isSelected ? 700 : 500,
                background: isSelected ? '#FFFFFF' : (moodColor || 'transparent'),
                color: moodColor && !isSelected ? '#FFFFFF' : (isSelected ? '#17120A' : '#4A3F32'),
                border: isToday ? '2px solid #7048E8' : (isSelected ? '1.5px solid rgba(112,72,232,0.3)' : 'none'),
                boxShadow: isSelected ? '0 3px 10px rgba(23,18,10,0.13)' : 'none',
                transition: 'all 0.15s ease',
                position:'relative',
              }}>
                {day}
              </div>
              {/* Session dot */}
              {hasSession && (
                <div style={{ width:5, height:5, borderRadius:'50%', background: moodColor || '#7048E8', opacity:0.85 }} />
              )}
              {!hasSession && <div style={{ width:5, height:5 }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface EntryPanelProps {
  dateKey: string;
  entry: JournalEntry | undefined;
  onSave: (entry: JournalEntry) => void;
}

function EntryPanel({ dateKey, entry, onSave }: EntryPanelProps) {
  const [editing, setEditing] = useState(!entry);
  const [mood, setMood] = useState<number>(entry?.mood || 0);
  const [text, setText] = useState(entry?.text || '');
  const [tags, setTags] = useState<string[]>(entry?.tags || []);
  const [saved, setSaved] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditing(!entry);
    setMood(entry?.mood || 0);
    setText(entry?.text || '');
    setTags(entry?.tags || []);
    setSaved(false);
  }, [dateKey, entry]);

  // Auto-resize textarea
  useEffect(() => {
    if (textRef.current) {
      textRef.current.style.height = 'auto';
      textRef.current.style.height = textRef.current.scrollHeight + 'px';
    }
  }, [text]);

  const handleSave = () => {
    if (!mood) return;
    const newEntry: JournalEntry = {
      date: dateKey, mood, text, tags,
      sessionBw: entry?.sessionBw,
      sessionMin: entry?.sessionMin,
      sessionHz: entry?.sessionHz,
    };
    onSave(newEntry);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const card: React.CSSProperties = {
    background:'#FFFFFF', border:'1px solid rgba(23,18,10,0.07)',
    borderRadius:16, boxShadow:'0 2px 12px rgba(23,18,10,0.06)',
    padding:'20px', margin:'0 20px',
  };

  const dateLabel = formatDateLabel(dateKey);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12, animation:'slideIn 0.2s ease' }}>
      <div style={card}>
        {/* Date header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ fontFamily:"'Space Grotesk', sans-serif", fontSize:17, fontWeight:700, color:'#17120A' }}>
            {dateLabel}
          </div>
          {entry && !editing && (
            <button
              onClick={() => setEditing(true)}
              style={{ background:'none', border:'none', cursor:'pointer', color:'#8C7D6C', padding:6, borderRadius:8,
                display:'flex', alignItems:'center', gap:4, fontSize:12 }}
              title="Edit entry"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
          )}
        </div>

        {/* Session snapshot */}
        {entry?.sessionBw && (
          <div style={{
            display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
            background:'rgba(112,72,232,0.05)', borderRadius:10, marginBottom:14,
            borderLeft:`3px solid ${BW_COLORS[entry.sessionBw] || '#7048E8'}`,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={BW_COLORS[entry.sessionBw] || '#7048E8'} strokeWidth="2" strokeLinecap="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:12, color:'#4A3F32' }}>
              {entry.sessionBw}
              {entry.sessionMin ? ` · ${entry.sessionMin} min` : ''}
              {entry.sessionHz ? ` · ${entry.sessionHz}Hz binaural` : ''}
            </span>
          </div>
        )}

        {editing ? (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Mood selector */}
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'#8C7D6C', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>
                How did you feel?
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'space-between' }}>
                {MOOD_CONFIG.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setMood(m.value)}
                    style={{
                      flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                      padding:'10px 4px', border:'none', borderRadius:12, cursor:'pointer',
                      background: mood === m.value ? m.color + '22' : 'rgba(23,18,10,0.04)',
                      transition:'all 0.15s ease',
                    }}
                  >
                    <AnahataOrb id={m.orbId} size={52} selected={mood === m.value} onClick={() => setMood(m.value)} />
                    <span style={{
                      fontSize:10, fontWeight:600,
                      color: mood === m.value ? m.color : '#8C7D6C',
                      fontFamily:"'Plus Jakarta Sans', sans-serif",
                    }}>
                      {m.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'#8C7D6C', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>
                Tags
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {PRESET_TAGS.map(tag => {
                  const active = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      style={{
                        padding:'5px 12px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12,
                        fontFamily:"'Plus Jakarta Sans', sans-serif", fontWeight:500,
                        background: active ? '#7048E8' : 'rgba(23,18,10,0.06)',
                        color: active ? '#FFFFFF' : '#4A3F32',
                        transition:'all 0.15s ease',
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reflection */}
            <div style={{ position:'relative' }}>
              <div style={{ fontSize:11, fontWeight:600, color:'#8C7D6C', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 }}>
                Reflection
              </div>
              <textarea
                ref={textRef}
                value={text}
                onChange={e => setText(e.target.value.slice(0,500))}
                placeholder="What are you carrying today? What did you release?"
                rows={3}
                style={{
                  width:'100%', resize:'none', border:'1.5px solid rgba(23,18,10,0.1)',
                  borderRadius:10, padding:'12px', fontFamily:"'Plus Jakarta Sans', sans-serif",
                  fontSize:14, color:'#17120A', background:'rgba(23,18,10,0.02)',
                  outline:'none', boxSizing:'border-box', lineHeight:1.6,
                  transition:'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#7048E8')}
                onBlur={e => (e.target.style.borderColor = 'rgba(23,18,10,0.1)')}
              />
              <div style={{ textAlign:'right', fontSize:11, color:'#C2B5A3', marginTop:4, fontFamily:"'JetBrains Mono', monospace" }}>
                {text.length}/500
              </div>
            </div>

            {/* Save */}
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <button
                onClick={handleSave}
                disabled={!mood}
                style={{
                  flex:1, padding:'12px', borderRadius:12, border:'none', cursor: mood ? 'pointer' : 'not-allowed',
                  background: mood ? 'linear-gradient(135deg, #7048E8 0%, #3B5BDB 100%)' : '#EEE9E0',
                  color: mood ? '#FFFFFF' : '#C2B5A3',
                  fontFamily:"'Space Grotesk', sans-serif", fontSize:15, fontWeight:700,
                  boxShadow: mood ? '0 4px 14px rgba(112,72,232,0.3)' : 'none',
                  transition:'all 0.2s ease',
                }}
              >
                Save Entry
              </button>
              {saved && (
                <span style={{ fontSize:14, color:'#0CA678', fontWeight:600, animation:'fadeIn 0.2s ease' }}>
                  Saved ✓
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Read-only view */
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {/* Mood display */}
            {entry && (
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{
                  display:'flex', alignItems:'center', gap:8, padding:'8px 16px',
                  borderRadius:24, background: MOOD_CONFIG[entry.mood-1].color + '18',
                }}>
                  <AnahataOrb id={MOOD_CONFIG[entry.mood-1].orbId} size={28} />
                  <span style={{ fontFamily:"'Plus Jakarta Sans', sans-serif", fontSize:13, fontWeight:600,
                    color: MOOD_CONFIG[entry.mood-1].color }}>
                    {MOOD_CONFIG[entry.mood-1].label}
                  </span>
                </div>
              </div>
            )}

            {/* Tags */}
            {entry?.tags.length ? (
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {entry.tags.map(tag => (
                  <span key={tag} style={{
                    padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:600,
                    background:'rgba(112,72,232,0.1)', color:'#7048E8',
                    fontFamily:"'Plus Jakarta Sans', sans-serif",
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            {/* Text */}
            {entry?.text && (
              <p style={{ margin:0, fontSize:14, color:'#4A3F32', lineHeight:1.7,
                fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                {entry.text}
              </p>
            )}

            {!entry && (
              <div style={{ textAlign:'center', padding:'16px 0', color:'#8C7D6C',
                fontFamily:"'Plus Jakarta Sans', sans-serif", fontSize:14 }}>
                No entry for this day. Tap edit to add one.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Saved confirmation outside card */}
      {saved && editing === false && (
        <div style={{ textAlign:'center', color:'#0CA678', fontWeight:600, fontSize:13, marginTop:-4 }}>Saved ✓</div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function JournalPage() {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [store, setStore] = useState<JournalStore>(loadStore);

  const handleSave = useCallback((entry: JournalEntry) => {
    setStore(prev => {
      const next = { ...prev, [entry.date]: entry };
      saveStore(next);
      return next;
    });
  }, []);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y-1); setMonth(11); }
    else setMonth(m => m-1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y+1); setMonth(0); }
    else setMonth(m => m+1);
  };

  // Streak
  const streak = calcStreak(store);

  // Monthly stats
  const monthEntries = Object.values(store).filter(e => {
    const [ey, em] = e.date.split('-').map(Number);
    return ey === year && em === month+1;
  });
  const totalSessions = monthEntries.filter(e => e.sessionBw).length;
  const avgMood = monthEntries.length ? (monthEntries.reduce((s,e) => s+e.mood, 0) / monthEntries.length).toFixed(1) : '—';
  const totalMinutes = monthEntries.reduce((s,e) => s+(e.sessionMin||0), 0);

  // Past entries list (current month, reverse date order)
  const pastEntries = [...monthEntries].sort((a,b) => b.date.localeCompare(a.date));

  const card: React.CSSProperties = {
    background:'#FFFFFF', border:'1px solid rgba(23,18,10,0.07)',
    borderRadius:16, boxShadow:'0 2px 12px rgba(23,18,10,0.06)',
  };

  return (
    <>
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        .journal-textarea:focus { border-color: #7048E8 !important; }
      `}</style>

      <div style={{ display:'flex', flexDirection:'column', gap:24, paddingBottom:32,
        fontFamily:"'Plus Jakarta Sans', sans-serif", background:'#F7F4EE', minHeight:'100%' }}>

        {/* ── A. Header strip ─────────────────────────────────────── */}
        <div style={{ padding:'20px 20px 0' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
            <div>
              <h1 style={{ margin:0, fontFamily:"'Space Grotesk', sans-serif", fontSize:24, fontWeight:700,
                color:'#17120A', letterSpacing:'-0.02em' }}>
                Journal
              </h1>
              <p style={{ margin:'2px 0 0', fontSize:13, color:'#8C7D6C' }}>Your inner record</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
              {/* Streak badge */}
              {streak >= 2 && (
                <div style={{
                  display:'flex', alignItems:'center', gap:5, padding:'5px 11px',
                  background:'linear-gradient(135deg,#F59F0022,#E6498022)', borderRadius:20,
                  border:'1px solid rgba(245,159,0,0.2)',
                }}>
                  <span style={{ fontSize:14 }}>🔥</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'#F59F00' }}>{streak} day streak</span>
                </div>
              )}
              {/* Month navigator */}
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <button onClick={prevMonth} style={{ background:'none', border:'none', cursor:'pointer',
                  color:'#8C7D6C', padding:4, display:'flex', alignItems:'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
                <span style={{ fontFamily:"'Space Grotesk', sans-serif", fontSize:14, fontWeight:600,
                  color:'#17120A', minWidth:120, textAlign:'center' }}>
                  {MONTHS[month]} {year}
                </span>
                <button onClick={nextMonth} style={{ background:'none', border:'none', cursor:'pointer',
                  color:'#8C7D6C', padding:4, display:'flex', alignItems:'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── B. Calendar grid ─────────────────────────────────────── */}
        <div style={{ ...card, margin:'0 20px', padding:'16px 0' }}>
          <Calendar
            year={year} month={month}
            store={store}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
          />
        </div>

        {/* ── C–G. Entry panel ─────────────────────────────────────── */}
        <EntryPanel
          key={selectedDate}
          dateKey={selectedDate}
          entry={store[selectedDate]}
          onSave={handleSave}
        />

        {/* ── H. Monthly summary strip ─────────────────────────────── */}
        <div style={{ padding:'0 20px' }}>
          <div style={{ fontFamily:"'Space Grotesk', sans-serif", fontSize:13, fontWeight:700,
            color:'#8C7D6C', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>
            {MONTHS[month]} at a glance
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
            {[
              { label:'Sessions', value: totalSessions, icon:'🧘', color:'#7048E8' },
              { label:'Avg Mood', value: avgMood,       icon:'✨', color:'#F59F00' },
              { label:'Minutes',  value: totalMinutes,  icon:'⏱', color:'#0CA678' },
            ].map(stat => (
              <div key={stat.label} style={{ ...card, padding:'14px 12px', textAlign:'center' }}>
                <div style={{ fontSize:20, marginBottom:4 }}>{stat.icon}</div>
                <div style={{ fontFamily:"'Space Grotesk', sans-serif", fontSize:20, fontWeight:700,
                  color: stat.color }}>
                  {stat.value}
                </div>
                <div style={{ fontSize:11, color:'#8C7D6C', fontWeight:600, marginTop:2 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── I. Past entries list ─────────────────────────────────── */}
        {pastEntries.length > 0 && (
          <div style={{ padding:'0 20px', display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontFamily:"'Space Grotesk', sans-serif", fontSize:13, fontWeight:700,
              color:'#8C7D6C', letterSpacing:'0.08em', textTransform:'uppercase' }}>
              This month's entries
            </div>
            <div style={{ ...card, overflow:'hidden' }}>
              {pastEntries.map((entry, idx) => {
                const moodCfg = MOOD_CONFIG[entry.mood-1];
                const preview = entry.text.length > 60 ? entry.text.slice(0,60)+'…' : entry.text;
                const dateStr = formatDateLabel(entry.date).replace(/,.*/, '').slice(0,3) + ' ' +
                  entry.date.split('-')[2];
                return (
                  <div
                    key={entry.date}
                    onClick={() => { setSelectedDate(entry.date); setYear(+entry.date.split('-')[0]); setMonth(+entry.date.split('-')[1]-1); }}
                    style={{
                      display:'flex', alignItems:'flex-start', gap:12, padding:'14px 16px',
                      borderBottom: idx < pastEntries.length-1 ? '1px solid rgba(23,18,10,0.06)' : 'none',
                      cursor:'pointer', transition:'background 0.12s',
                      background: selectedDate === entry.date ? 'rgba(112,72,232,0.04)' : 'transparent',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background='rgba(23,18,10,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background= selectedDate===entry.date ? 'rgba(112,72,232,0.04)' : 'transparent')}
                  >
                    {/* Mood dot */}
                    <div style={{ marginTop:3, flexShrink:0 }}>
                      <MoodDot mood={entry.mood} size={10} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                        <span style={{ fontFamily:"'Space Grotesk', sans-serif", fontSize:13, fontWeight:700,
                          color:'#17120A' }}>
                          {formatDateLabel(entry.date).split(',').slice(0,2).join(',')}
                        </span>
                        <AnahataOrb id={moodCfg.orbId} size={20} />
                      </div>
                      {preview && (
                        <p style={{ margin:'0 0 6px', fontSize:12, color:'#8C7D6C', lineHeight:1.5 }}>
                          {preview || <em>No reflection</em>}
                        </p>
                      )}
                      {entry.tags.length > 0 && (
                        <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                          {entry.tags.map(tag => (
                            <span key={tag} style={{
                              padding:'2px 8px', borderRadius:12, fontSize:10, fontWeight:600,
                              background:'rgba(112,72,232,0.08)', color:'#7048E8',
                            }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {entry.sessionBw && (
                      <div style={{
                        flexShrink:0, display:'flex', alignItems:'center', gap:3,
                        padding:'3px 8px', borderRadius:8,
                        background: (BW_COLORS[entry.sessionBw]||'#7048E8')+'15',
                      }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                          stroke={BW_COLORS[entry.sessionBw]||'#7048E8'} strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                        </svg>
                        <span style={{ fontSize:10, fontWeight:700, color: BW_COLORS[entry.sessionBw]||'#7048E8',
                          fontFamily:"'JetBrains Mono', monospace" }}>
                          {entry.sessionBw}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {pastEntries.length === 0 && (
          <div style={{ textAlign:'center', padding:'16px 20px', color:'#C2B5A3', fontSize:13 }}>
            No entries yet this month. Start by selecting a day above.
          </div>
        )}
      </div>
    </>
  );
}
