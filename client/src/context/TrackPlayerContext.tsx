import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Track, Album } from '../data/libraryData';
import { TRACK_PLAYER_START_EVENT, SOUND_ENGINE_START_EVENT } from './audioEvents';
import { useAuth } from './AuthContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function parseDuration(s: string): number {
  if (s.includes('min')) return parseInt(s) * 60;
  if (s.includes('hr'))  return parseInt(s) * 3600;
  const parts = s.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 300;
}
export function formatSecs(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

// ─── YouTube IFrame API types ────────────────────────────────────────────────
declare global {
  interface Window {
    YT: { Player: new (el: HTMLElement, opts: object) => YTPlayer; PlayerState: Record<string, number> };
    onYouTubeIframeAPIReady?: () => void;
  }
}
interface YTPlayer {
  playVideo(): void; pauseVideo(): void; stopVideo(): void; destroy(): void;
  seekTo(s: number, a: boolean): void; setVolume(v: number): void;
  unMute(): void; getCurrentTime(): number; getDuration(): number;
}

const YT_SCRIPT_ID = 'yt-iframe-api';
function loadYouTubeApi(): void {
  if (window.YT?.Player || document.getElementById(YT_SCRIPT_ID)) return;
  const script = document.createElement('script');
  script.id = YT_SCRIPT_ID;
  script.src = 'https://www.youtube.com/iframe_api';
  script.async = true;
  document.head.appendChild(script);
}

// ─── Context type ─────────────────────────────────────────────────────────────
interface TrackPlayerContextType {
  currentTrack: Track | null;
  currentAlbum: Album | null;
  isPlaying: boolean;
  isExpanded: boolean;
  progress: number;
  elapsed: number;
  shuffle: boolean;
  repeat: boolean;
  volume: number;
  loading: boolean;
  ytError: string | null;
  sleepTimerMinutes: number | null;
  queue: Track[];
  favorites: Set<string>;
  playTrack: (track: Track, album: Album, queue?: Track[]) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;
  playFromQueue: (track: Track) => void;
  handleSeek: (pct: number) => void;
  handleVolume: (v: number) => void;
  handleShuffle: (album: Album) => void;
  setIsExpanded: (v: boolean) => void;
  toggleRepeat: () => void;
  setSleepTimer: (minutes: number | null) => void;
  toggleFavorite: (trackId: string) => void;
  isFavorite: (trackId: string) => boolean;
}

const TrackPlayerContext = createContext<TrackPlayerContextType | null>(null);

export function useTrackPlayer(): TrackPlayerContextType {
  const ctx = useContext(TrackPlayerContext);
  if (!ctx) throw new Error('useTrackPlayer must be used inside TrackPlayerProvider');
  return ctx;
}

const RESUME_KEY_PREFIX = 'anahata_resume_';
const FAVORITES_KEY = 'anahata_favorite_tracks';

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}
function saveFavorites(favs: Set<string>) {
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favs])); } catch { /* storage unavailable */ }
}

export function TrackPlayerProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, authFetch } = useAuth();
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [isExpanded,   setIsExpanded]   = useState(false);
  const [progress,     setProgress]     = useState(0);
  const [elapsed,      setElapsed]      = useState(0);
  const [shuffle,      setShuffle]      = useState(false);
  const [repeat,       setRepeat]       = useState(false);
  const [volume,       setVolume]       = useState(80);
  const [loading,      setLoading]      = useState(false);
  const [ytError,      setYtError]      = useState<string | null>(null);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [queue,        setQueue]        = useState<Track[]>([]);
  const [favorites,    setFavorites]    = useState<Set<string>>(() => loadFavorites());

  const ytRef            = useRef<YTPlayer | null>(null);
  const audioRef         = useRef<HTMLAudioElement | null>(null);
  const prefetchRef      = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadingOutRef     = useRef(false);
  const ytDivRef         = useRef<HTMLDivElement>(null);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const createTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sleepTimeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sleepFadeRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const queueRef         = useRef<Track[]>([]);
  const elapsedRef       = useRef(0);
  const durationRef      = useRef(0);
  const activeIdRef      = useRef('');
  const currentTrackRef  = useRef<Track | null>(null);
  const currentAlbumRef  = useRef<Album | null>(null);
  const isNativeAudioRef = useRef(false);
  const repeatRef        = useRef(repeat);
  const shuffleRef       = useRef(shuffle);
  const volumeRef        = useRef(volume);
  const authRef          = useRef({ isAuthenticated: false, authFetch });
  currentTrackRef.current = currentTrack;
  currentAlbumRef.current = currentAlbum;
  repeatRef.current       = repeat;
  shuffleRef.current      = shuffle;
  volumeRef.current       = volume;
  authRef.current         = { isAuthenticated, authFetch };

  useEffect(() => {
    if (!isAuthenticated) {
      setFavorites(loadFavorites());
      return;
    }

    let active = true;
    authFetch('/api/library/favourites')
      .then(async res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (!active || !Array.isArray(data?.favourites)) return;
        const next = new Set<string>(data.favourites.map((fav: { track_id?: string }) => fav.track_id).filter(Boolean));
        setFavorites(next);
        saveFavorites(next);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [authFetch, isAuthenticated]);

  function recordLibraryPlay(trackId: string) {
    const auth = authRef.current;
    if (!auth.isAuthenticated) return;
    auth.authFetch('/api/library/plays', {
      method: 'POST',
      body: JSON.stringify({ track_id: trackId, duration_played: 0 }),
    }).catch(() => {});
  }

  useEffect(() => {
    return () => {
      stopTimer();
      if (createTimeoutRef.current) clearTimeout(createTimeoutRef.current);
      if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current);
      if (sleepFadeRef.current) clearInterval(sleepFadeRef.current);
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      try { ytRef.current?.destroy(); } catch { /**/ }
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
      if (prefetchRef.current) { prefetchRef.current.src = ''; }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function startTimer() {
    stopTimer();
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      const dur = durationRef.current;
      if (dur > 0) setProgress(elapsedRef.current / dur);
      setElapsed(elapsedRef.current);
      if (elapsedRef.current >= dur && dur > 0) {
        stopTimer();
        setIsPlaying(false);
        if (repeatRef.current) restartCurrent();
        else playNext();
      }
    }, 1000);
  }

  function restartCurrent() {
    const t = currentTrackRef.current; const a = currentAlbumRef.current;
    if (!t || !a) return;
    triggerPlay(t, a, queueRef.current);
  }

  // Soft crossfade: ramps an <audio> element's volume over `ms`, replacing
  // any fade already in progress. Used to fade a track in on start and out
  // just before it naturally ends, so track boundaries aren't a hard cut.
  function fadeVolume(audio: HTMLAudioElement, from: number, to: number, ms: number, onDone?: () => void) {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    const steps = Math.max(1, Math.round(ms / 50));
    let i = 0;
    audio.volume = Math.max(0, Math.min(1, from));
    fadeIntervalRef.current = setInterval(() => {
      i += 1;
      audio.volume = Math.max(0, Math.min(1, from + (to - from) * (i / steps)));
      if (i >= steps) {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
        onDone?.();
      }
    }, 50);
  }

  // Persist/resume playback position per track so long ragas pick up where
  // you left off instead of always restarting from zero.
  function saveResumePosition(trackId: string, seconds: number) {
    try {
      if (seconds < 5) { localStorage.removeItem(RESUME_KEY_PREFIX + trackId); return; }
      localStorage.setItem(RESUME_KEY_PREFIX + trackId, String(Math.floor(seconds)));
    } catch { /* storage unavailable */ }
  }
  function readResumePosition(trackId: string): number {
    try {
      const raw = localStorage.getItem(RESUME_KEY_PREFIX + trackId);
      return raw ? parseInt(raw, 10) || 0 : 0;
    } catch { return 0; }
  }

  // Quietly primes the next queued track's audio so auto-advance / skip
  // feels instant instead of waiting on a fresh network request.
  function prefetchNext(afterTrack: Track) {
    const q = queueRef.current;
    const idx = q.findIndex(t => t.id === afterTrack.id);
    const next = idx >= 0 && idx < q.length - 1 ? q[idx + 1] : null;
    if (prefetchRef.current) { prefetchRef.current.src = ''; prefetchRef.current = null; }
    if (next?.audioUrl) {
      const a = new Audio();
      a.preload = 'auto';
      a.src = next.audioUrl;
      a.volume = 0;
      prefetchRef.current = a;
    }
  }

  const triggerPlay = useCallback((track: Track, album: Album, queue: Track[]) => {
    if (currentTrackRef.current && currentTrackRef.current.id !== track.id) {
      const prevSec = isNativeAudioRef.current && audioRef.current ? audioRef.current.currentTime : elapsedRef.current;
      saveResumePosition(currentTrackRef.current.id, prevSec);
    }
    window.dispatchEvent(new CustomEvent(TRACK_PLAYER_START_EVENT));

    setCurrentTrack(track);
    recordLibraryPlay(track.id);
    setCurrentAlbum(album);
    queueRef.current = queue;
    setQueue(queue);
    setIsPlaying(false);
    setLoading(true);
    setProgress(0);
    setElapsed(0);
    elapsedRef.current = 0;
    durationRef.current = parseDuration(track.duration);
    activeIdRef.current = track.id;
    setYtError(null);

    stopTimer();
    if (createTimeoutRef.current) {
      clearTimeout(createTimeoutRef.current);
      createTimeoutRef.current = null;
    }

    // Clean up previous player (audio or YouTube)
    if (fadeIntervalRef.current) { clearInterval(fadeIntervalRef.current); fadeIntervalRef.current = null; }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.oncanplay = null;
      audioRef.current.onplay = null;
      audioRef.current.onpause = null;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.onloadedmetadata = null;
      audioRef.current = null;
    }
    try { ytRef.current?.destroy(); } catch { /**/ }
    ytRef.current = null;
    isNativeAudioRef.current = false;

    const resumeAt = readResumePosition(track.id);

    // Use native audio if track has audioUrl
    if (track.audioUrl) {
      isNativeAudioRef.current = true;
      const isPrefetched = !!prefetchRef.current && prefetchRef.current.src === new URL(track.audioUrl, window.location.href).href;
      const audio = isPrefetched ? prefetchRef.current! : new Audio();
      prefetchRef.current = null;
      audioRef.current = audio;
      // Re-assigning .src to the same URL would abort the prefetch's
      // buffered data and restart the network request — only set it when
      // this isn't the already-primed prefetch element.
      if (!isPrefetched) audio.src = track.audioUrl;
      audio.volume = 0;
      fadingOutRef.current = false;

      const cleanupAudio = () => {
        if (fadeIntervalRef.current) { clearInterval(fadeIntervalRef.current); fadeIntervalRef.current = null; }
        audio.onerror = null;
        audio.oncanplay = null;
        audio.onplay = null;
        audio.onpause = null;
        audio.onended = null;
        audio.ontimeupdate = null;
        audio.onloadedmetadata = null;
        audio.pause();
        audio.src = '';
        if (audioRef.current === audio) audioRef.current = null;
      };

      audio.oncanplay = () => {
        if (activeIdRef.current !== track.id) return;
        setLoading(false);
        setYtError(null);
      };
      audio.onplay = () => {
        if (activeIdRef.current !== track.id) return;
        setIsPlaying(true);
        fadeVolume(audio, 0, volumeRef.current / 100, 500);
      };
      audio.onpause = () => { setIsPlaying(false); };
      audio.onended = () => {
        setIsPlaying(false);
        saveResumePosition(track.id, 0);
        if (repeatRef.current) { audio.currentTime = 0; audio.volume = 0; audio.play().catch(() => {}); }
        else playNext();
      };
      audio.ontimeupdate = () => {
        if (activeIdRef.current !== track.id) return;
        const cur = audio.currentTime;
        elapsedRef.current = cur;
        setElapsed(Math.floor(cur));
        const dur = audio.duration || durationRef.current;
        if (dur > 0) setProgress(cur / dur);
        // Crossfade out over the final ~1.2s of a track, unless it's on repeat.
        const remaining = dur - cur;
        if (!repeatRef.current && dur > 3 && remaining <= 1.2 && remaining > 0 && !fadingOutRef.current) {
          fadingOutRef.current = true;
          fadeVolume(audio, audio.volume, 0, Math.max(150, remaining * 1000));
        } else if (fadingOutRef.current && remaining > 1.2) {
          // User seeked back out of the fade-out window — restore volume
          // so the track doesn't keep playing silently.
          fadingOutRef.current = false;
          fadeVolume(audio, audio.volume, volumeRef.current / 100, 300);
        }
      };
      audio.onerror = () => {
        cleanupAudio();
        setLoading(false);
        setIsPlaying(false);
        setYtError('Opening another playback path...');
        isNativeAudioRef.current = false;
        setupYouTubePlayer();
      };
      audio.onloadedmetadata = () => {
        if (activeIdRef.current === track.id) {
          durationRef.current = audio.duration;
          if (resumeAt > 0 && resumeAt < audio.duration - 10) {
            audio.currentTime = resumeAt;
            elapsedRef.current = resumeAt;
            setElapsed(resumeAt);
          }
        }
      };
      audio.play().then(() => {
        if (activeIdRef.current !== track.id) return;
        prefetchNext(track);
      }).catch(() => {
        if (activeIdRef.current !== track.id) return;
        cleanupAudio();
        setLoading(false);
        setYtError('Opening another playback path...');
        isNativeAudioRef.current = false;
        setupYouTubePlayer();
      });
      return;
    }

    // Fall back to YouTube
    setupYouTubePlayer();

    function setupYouTubePlayer() {
      loadYouTubeApi();
      const container = ytDivRef.current;
      if (!container) { setLoading(false); setYtError('This track needs a fresh start.'); return; }
      container.innerHTML = '';
      const div = document.createElement('div');
      container.appendChild(div);

      let apiWaitMs = 0;
      function tryCreate() {
        if (activeIdRef.current !== track.id) return;
        if (!window.YT?.Player) {
          apiWaitMs += 200;
          if (apiWaitMs >= 10000) {
            setLoading(false);
            setYtError('This track could not open. Please check your connection.');
            return;
          }
          createTimeoutRef.current = setTimeout(tryCreate, 200);
          return;
        }

        ytRef.current = new window.YT.Player(div, {
          videoId: track.ytId,
          width: 320, height: 180,
          playerVars: {
            autoplay: 1,
            controls: 0,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (e: { target: YTPlayer }) => {
              if (activeIdRef.current !== track.id) return;
              e.target.unMute();
              e.target.setVolume(volumeRef.current);
              e.target.playVideo();
            },
            onStateChange: (e: { data: number }) => {
              if (activeIdRef.current !== track.id) return;
              const S = window.YT?.PlayerState;
              if (!S) return;
              if (e.data === S.PLAYING)   { setIsPlaying(true);  setLoading(false); setYtError(null); if (!timerRef.current) startTimer(); }
              if (e.data === S.PAUSED)    { setIsPlaying(false); stopTimer(); }
              if (e.data === S.BUFFERING) { setLoading(true); }
              if (e.data === S.ENDED) {
                setIsPlaying(false); stopTimer();
                if (repeatRef.current) { ytRef.current?.seekTo(0, true); ytRef.current?.playVideo(); }
                else playNext();
              }
            },
            onError: (e: { data: number }) => {
              if (activeIdRef.current !== track.id) return;
              setLoading(false); setIsPlaying(false);
              const code = e.data;
              const msg =
                code === 2   ? 'This track could not open.' :
                code === 5   ? 'This track needs another playback path.' :
                code === 100 ? 'This track is not available right now.' :
                (code === 101 || code === 150) ? 'This track is not available here. Try another one.' :
                'Playback needs another try.';
              setYtError(msg);
              console.error('[YT] error code:', code, msg);
            },
          },
        });
      }
      tryCreate();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function playTrack(track: Track, album: Album, queue?: Track[]) {
    triggerPlay(track, album, queue ?? album.tracks);
  }

  function togglePlay() {
    if (isNativeAudioRef.current && audioRef.current) {
      isPlaying ? audioRef.current.pause() : audioRef.current.play().catch(() => {});
    } else if (ytRef.current) {
      isPlaying ? ytRef.current.pauseVideo() : ytRef.current.playVideo();
    }
  }

  function playNext() {
    const q = queueRef.current;
    const track = currentTrackRef.current;
    const album = currentAlbumRef.current;
    if (!track || !album || q.length === 0) return;
    const idx = q.findIndex(t => t.id === track.id);
    if (shuffleRef.current) {
      triggerPlay(q[Math.floor(Math.random() * q.length)], album, q);
    } else if (idx < q.length - 1) {
      triggerPlay(q[idx + 1], album, q);
    }
  }

  function playPrev() {
    const q = queueRef.current;
    const curTrack = currentTrackRef.current;
    const curAlbum = currentAlbumRef.current;
    if (!curTrack || !curAlbum || q.length === 0) return;
    const cur = isNativeAudioRef.current && audioRef.current ? audioRef.current.currentTime : ytRef.current?.getCurrentTime() ?? elapsedRef.current;
    if (cur > 3) {
      if (isNativeAudioRef.current && audioRef.current) audioRef.current.currentTime = 0;
      else ytRef.current?.seekTo(0, true);
      return;
    }
    const idx = q.findIndex(t => t.id === curTrack.id);
    if (idx > 0) triggerPlay(q[idx - 1], curAlbum, q);
  }

  function handleSeek(pct: number) {
    const dur = isNativeAudioRef.current && audioRef.current ? audioRef.current.duration : ytRef.current?.getDuration() ?? durationRef.current;
    const target = Math.floor(dur * pct);
    if (isNativeAudioRef.current && audioRef.current) audioRef.current.currentTime = target;
    else ytRef.current?.seekTo(target, true);
    elapsedRef.current = target;
    setElapsed(target);
    setProgress(pct);
  }

  function handleVolume(v: number) {
    setVolume(v);
    if (isNativeAudioRef.current && audioRef.current) {
      if (fadeIntervalRef.current) { clearInterval(fadeIntervalRef.current); fadeIntervalRef.current = null; }
      audioRef.current.volume = v / 100;
    } else {
      ytRef.current?.setVolume(v);
    }
  }

  function handleShuffle(album: Album) {
    const shuffled = [...album.tracks].sort(() => Math.random() - 0.5);
    playTrack(shuffled[0], album, shuffled);
    setShuffle(true);
  }

  function toggleRepeat() {
    setRepeat(r => !r);
  }

  // Jump straight to a track already sitting in the current queue (used by
  // the "up next" drawer) without disturbing the rest of the queue order.
  function playFromQueue(track: Track) {
    const album = currentAlbumRef.current;
    if (!album) return;
    triggerPlay(track, album, queueRef.current);
  }

  function toggleFavorite(trackId: string) {
    const wasFavorite = favorites.has(trackId);
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      saveFavorites(next);
      return next;
    });

    if (isAuthenticated) {
      authFetch(`/api/library/favourites/${encodeURIComponent(trackId)}`, {
        method: wasFavorite ? 'DELETE' : 'POST',
      }).catch(() => {});
    }
  }
  function isFavorite(trackId: string) {
    return favorites.has(trackId);
  }

  // ── Sleep timer: fades volume out over the last 20s, then pauses ──────────
  // Sets the volume of whichever engine is actually playing without
  // touching the `volume` React state — the sleep-timer fade ticks once a
  // second and shouldn't re-render the whole player or overwrite the
  // user's chosen volume setting.
  function setEngineVolume(v: number) {
    if (isNativeAudioRef.current && audioRef.current) audioRef.current.volume = Math.max(0, v) / 100;
    else ytRef.current?.setVolume(Math.max(0, v));
  }

  function setSleepTimer(minutes: number | null) {
    if (sleepTimeoutRef.current) { clearTimeout(sleepTimeoutRef.current); sleepTimeoutRef.current = null; }
    if (sleepFadeRef.current) {
      clearInterval(sleepFadeRef.current);
      sleepFadeRef.current = null;
      setEngineVolume(volumeRef.current); // cancelled mid-fade — restore
    }
    setSleepTimerMinutes(minutes);
    if (minutes == null) return;

    const fadeStartMs = Math.max(0, minutes * 60_000 - 20_000);
    sleepTimeoutRef.current = setTimeout(() => {
      const startVol = volumeRef.current;
      const steps = 20;
      let i = 0;
      sleepFadeRef.current = setInterval(() => {
        i += 1;
        setEngineVolume(Math.round(startVol * (1 - i / steps)));
        if (i >= steps) {
          if (sleepFadeRef.current) clearInterval(sleepFadeRef.current);
          sleepFadeRef.current = null;
          if (isNativeAudioRef.current && audioRef.current) audioRef.current.pause();
          else ytRef.current?.pauseVideo();
          setEngineVolume(startVol);
          setSleepTimerMinutes(null);
        }
      }, 1000);
    }, fadeStartMs);
  }

  // ── Auto-duck: pause real playback if the generative engine starts, so
  // the two audio systems never fight for the speaker at once ──────────────
  useEffect(() => {
    const onEngineStart = () => {
      if (isNativeAudioRef.current && audioRef.current) audioRef.current.pause();
      else if (ytRef.current) ytRef.current.pauseVideo();
    };
    window.addEventListener(SOUND_ENGINE_START_EVENT, onEngineStart);
    return () => window.removeEventListener(SOUND_ENGINE_START_EVENT, onEngineStart);
  }, []);

  // ── MediaSession: lock-screen / headset / notification controls ───────────
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack || !currentAlbum) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentAlbum.title,
      artwork: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    });
    navigator.mediaSession.setActionHandler('play', togglePlay);
    navigator.mediaSession.setActionHandler('pause', togglePlay);
    navigator.mediaSession.setActionHandler('previoustrack', playPrev);
    navigator.mediaSession.setActionHandler('nexttrack', playNext);
    return () => {
      if (!('mediaSession' in navigator)) return;
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack, currentAlbum]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  const ytHost = (
    <div ref={ytDivRef} style={{ position: 'fixed', bottom: -9999, left: -9999, width: 1, height: 1, zIndex: -1 }} />
  );

  const value: TrackPlayerContextType = {
    currentTrack, currentAlbum, isPlaying, isExpanded, progress, elapsed,
    shuffle, repeat, volume, loading, ytError, sleepTimerMinutes, queue, favorites,
    playTrack, togglePlay, playNext, playPrev, playFromQueue, handleSeek, handleVolume,
    handleShuffle, setIsExpanded, toggleRepeat, setSleepTimer, toggleFavorite, isFavorite,
  };

  return (
    <TrackPlayerContext.Provider value={value}>
      {ytHost}
      {children}
    </TrackPlayerContext.Provider>
  );
}
