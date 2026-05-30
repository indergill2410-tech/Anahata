import React, { useState, useEffect, useCallback } from 'react';
import TrackCard from '../components/TrackCard';
import TrackPlayer from '../components/TrackPlayer';

const CATEGORIES_ORDER = [
  'All',
  'Binaural + Indian Fusion',
  'Theta Waves',
  'Alpha Waves',
  'Delta Waves',
  'Beta Waves',
  'Gamma Waves',
  'Indian Classical',
  'Solfeggio Frequencies',
];

const SORT_OPTIONS = [
  { value: 'title',    label: 'A–Z' },
  { value: 'duration', label: 'Longest' },
  { value: 'binaural', label: 'Hz ↑' },
  { value: 'bpm',      label: 'BPM ↑' },
];

export default function LibraryPage() {
  const [tracks, setTracks]       = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [category, setCategory]   = useState('All');
  const [sort, setSort]           = useState('title');
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [pages, setPages]         = useState(1);
  const [playing, setPlaying]     = useState(null); // active track object
  const [categories, setCategories] = useState([]);

  // Fetch category counts once
  useEffect(() => {
    fetch('/api/library/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  const fetchTracks = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ sort, page, limit: 18 });
    if (category !== 'All') params.set('category', category);
    if (search.trim()) params.set('search', search.trim());

    fetch(`/api/library?${params}`)
      .then(r => r.json())
      .then(d => {
        setTracks(d.tracks || []);
        setTotal(d.pagination?.total || 0);
        setPages(d.pagination?.pages || 1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category, sort, search, page]);

  useEffect(() => { fetchTracks(); }, [fetchTracks]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [category, sort, search]);

  function fmtDur(secs) {
    const m = Math.floor(secs / 60);
    const h = Math.floor(m / 60);
    return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
  }

  return (
    <div className="dashboard fade-in">

      {/* Search */}
      <div style={{ position: 'relative', marginTop: 8 }}>
        <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--t3)', pointerEvents:'none' }}
          width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="form-input"
          style={{ paddingLeft: 36 }}
          placeholder="Search tracks, ragas, instruments…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Category Filter Pills */}
      <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4, scrollbarWidth:'none' }}>
        {CATEGORIES_ORDER.map(cat => {
          const count = cat === 'All' ? total : (categories.find(c => c.name === cat)?.count || 0);
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                flexShrink: 0,
                height: 30,
                padding: '0 12px',
                borderRadius: 'var(--r-full)',
                border: `1px solid ${category === cat ? 'var(--accent)' : 'var(--border)'}`,
                background: category === cat ? 'var(--accent-low)' : 'transparent',
                color: category === cat ? 'var(--accent-hi)' : 'var(--t3)',
                fontSize: 12,
                fontWeight: 500,
                fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'all var(--dur) var(--ease)',
                whiteSpace: 'nowrap',
              }}
            >
              {cat} {count > 0 && <span style={{ opacity:0.6 }}>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Sort + Count Row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span className="text-subtle" style={{ fontSize:12 }}>
          {loading ? 'Loading…' : `${total} tracks`}
        </span>
        <div style={{ display:'flex', gap:4 }}>
          {SORT_OPTIONS.map(o => (
            <button key={o.value} onClick={() => setSort(o.value)} style={{
              height:28, padding:'0 10px', borderRadius:'var(--r-sm)',
              border: `1px solid ${sort===o.value ? 'var(--accent)':'var(--border)'}`,
              background: sort===o.value ? 'var(--accent-low)' : 'transparent',
              color: sort===o.value ? 'var(--accent-hi)' : 'var(--t3)',
              fontSize:11, fontWeight:500, fontFamily:'inherit', cursor:'pointer',
              transition:'all var(--dur) var(--ease)'
            }}>{o.label}</button>
          ))}
        </div>
      </div>

      {/* Track Grid */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'40px 0' }}>
          <div className="spinner" style={{ width:24, height:24 }} />
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {tracks.map(track => (
            <TrackCard
              key={track.id}
              track={track}
              isPlaying={playing?.id === track.id}
              onPlay={() => setPlaying(playing?.id === track.id ? null : track)}
              fmtDur={fmtDur}
            />
          ))}
          {tracks.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 0', color:'var(--t3)', fontSize:13 }}>
              No tracks found.
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display:'flex', gap:8, justifyContent:'center', paddingBottom:8 }}>
          <button className="btn btn-ghost" style={{ height:34, padding:'0 14px', fontSize:13 }}
            disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
          <span style={{ display:'flex', alignItems:'center', fontSize:13, color:'var(--t2)' }}>
            {page} / {pages}
          </span>
          <button className="btn btn-ghost" style={{ height:34, padding:'0 14px', fontSize:13 }}
            disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}

      {/* Sticky Player */}
      {playing && (
        <TrackPlayer track={playing} onClose={() => setPlaying(null)} />
      )}
    </div>
  );
}
