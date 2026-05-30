import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../context/ToastContext';

interface MixData {
  name?: string;
  intention?: string;
  tags?: string[];
  bpm?: number;
  chaos?: number;
  settings?: Record<string, unknown>;
  layers?: Record<string, unknown>;
}

interface AIResponse {
  message: string;
  mix: MixData | null;
}

interface Props {
  onClose: () => void;
  onApplyMix: (mix: MixData) => void;
}

const SUGGESTIONS = [
  'Help me sleep after a stressful day',
  'Deep focus for 3 hours of coding',
  'Heal anxiety and calm my nervous system',
  'Morning energy and motivation boost',
  'Deep meditation and inner peace',
  'Creative flow state for art',
  'Grief and emotional release',
  'Headache relief and body relaxation',
];

const LAYER_COLORS: Record<string, string> = {
  binaural: '#1E90FF', drone: '#A855F7', instrument: '#E8303A',
  nature: '#00D68F', solfeggio: '#FFB800',
};

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  const idxRef = useRef(0);

  useEffect(() => {
    setDisplayed('');
    idxRef.current = 0;
    const iv = setInterval(() => {
      if (idxRef.current < text.length) {
        setDisplayed(text.slice(0, idxRef.current + 1));
        idxRef.current++;
      } else {
        clearInterval(iv);
      }
    }, 18);
    return () => clearInterval(iv);
  }, [text]);

  return <span>{displayed}<span style={{ opacity: 0.5, animation: 'glowPulse 0.8s infinite' }}>|</span></span>;
}

function LoadingOrb() {
  return (
    <div className="ai-loading-orb">
      {[48, 64, 80].map((size, i) => (
        <div key={size} className="ai-loading-ring" style={{
          width: size, height: size,
          borderColor: `rgba(168,85,247,${0.8 - i * 0.2})`,
          animationDelay: `${i * 0.3}s`,
          borderWidth: 1.5,
          borderStyle: 'solid',
        }} />
      ))}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    </div>
  );
}

export default function AIMixDialog({ onClose, onApplyMix }: Props) {
  const [prompt,   setPrompt]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [applied,  setApplied]  = useState(false);
  const { success, error } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setTimeout(() => textareaRef.current?.focus(), 400); }, []);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setResponse(null);
    setApplied(false);
    try {
      const res = await fetch('/api/ai/mix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text.trim() }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error || 'AI unavailable');
      }
      const data: AIResponse = await res.json();
      setResponse(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'AI assistant unavailable — add ANTHROPIC_API_KEY to server env.';
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!response?.mix) return;
    onApplyMix(response.mix);
    setApplied(true);
    success(`✨ Mix applied: ${response.mix.name || 'AI Mix'}`);
    setTimeout(onClose, 1200);
  };

  const layerEntries = response?.mix?.layers
    ? Object.entries(response.mix.layers as Record<string, { active?: boolean; volume?: number }>)
    : [];

  return (
    <div className="ai-dialog-overlay" onClick={onClose}>
      <div className="ai-dialog-sheet" onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: 'rgba(168,85,247,0.4)', borderRadius: 2, margin: '0 auto 20px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'linear-gradient(135deg, #A855F7, #1E90FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(168,85,247,0.4)',
            flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.08em' }}>
              AI MUSIC GUIDE
            </div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
              Describe your mood — get your perfect mix
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ marginLeft: 'auto', padding: '6px 8px', fontSize: 16 }}>✕</button>
        </div>

        {/* Prompt input */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 16 }}>
          <textarea
            ref={textareaRef}
            className="ai-prompt-input"
            placeholder="e.g. I've had a stressful week and need deep sleep…"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(prompt); } }}
            rows={2}
            style={{ flex: 1 }}
          />
          <button
            className="ai-send-btn"
            onClick={() => send(prompt)}
            disabled={loading || !prompt.trim()}
          >
            {loading
              ? <div className="spinner" style={{ width: 16, height: 16, borderTopColor: 'white' }} />
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
            }
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <LoadingOrb />
            <p style={{ fontSize: 13, color: 'var(--t3)', fontStyle: 'italic' }}>
              Crafting your soundscape…
            </p>
            <p style={{ fontSize: 11, color: 'var(--t4)', marginTop: 4 }}>
              Consulting the ancient ragas
            </p>
          </div>
        )}

        {/* Suggestions */}
        {!loading && !response && (
          <>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              Quick prompts
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} className="ai-chip" onClick={() => { setPrompt(s); send(s); }}>{s}</button>
              ))}
            </div>
          </>
        )}

        {/* Response */}
        {response && !loading && (
          <div>
            {/* Message with typewriter */}
            <div className="ai-typewriter">
              <TypewriterText text={response.message} />
            </div>

            {/* Mix card */}
            {response.mix && (
              <div className="ai-mix-card" style={{ marginTop: 16 }}>
                {/* Mix name */}
                <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '0.06em', marginBottom: 10 }}>
                  {response.mix.name || 'Custom Mix'}
                </div>

                {/* Tags */}
                {response.mix.tags && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                    {response.mix.tags.map(tag => (
                      <span key={tag} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', color: 'var(--t2)', fontWeight: 600 }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Layer chips */}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
                  {layerEntries.map(([name, cfg]) => {
                    const color = LAYER_COLORS[name] || '#fff';
                    const isActive = cfg.active !== false;
                    return (
                      <div key={name} style={{
                        padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                        border: `1px solid ${isActive ? color : 'rgba(255,255,255,0.1)'}`,
                        background: isActive ? `${color}18` : 'transparent',
                        color: isActive ? color : 'var(--t4)',
                        display: 'flex', alignItems: 'center', gap: 5,
                        transition: 'all 0.3s',
                      }}>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: isActive ? color : 'var(--t4)', boxShadow: isActive ? `0 0 4px ${color}` : 'none' }} />
                        {name.toUpperCase()}
                        {isActive && <span style={{ opacity: 0.6, fontFamily: 'JetBrains Mono, monospace' }}>{Math.round((cfg.volume as number || 0.5) * 100)}%</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                  {response.mix.bpm && (
                    <div>
                      <div style={{ fontSize: 9, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>BPM</div>
                      <div style={{ fontSize: 18, fontFamily: 'JetBrains Mono, monospace', color: 'var(--neon-gold)', fontWeight: 600 }}>{response.mix.bpm}</div>
                    </div>
                  )}
                  {response.mix.intention && (
                    <div>
                      <div style={{ fontSize: 9, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Intention</div>
                      <div style={{ fontSize: 14, color: '#fff', fontWeight: 700, marginTop: 2 }}>{response.mix.intention}</div>
                    </div>
                  )}
                </div>

                {/* Apply button */}
                <button
                  className="btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: 14, letterSpacing: '0.06em', opacity: applied ? 0.6 : 1 }}
                  onClick={handleApply}
                  disabled={applied}
                >
                  {applied ? '✓ Applied!' : '⚡ Apply This Mix'}
                </button>
              </div>
            )}

            {/* Try again */}
            <button
              className="btn-ghost"
              style={{ marginTop: 14, fontSize: 12, width: '100%' }}
              onClick={() => { setResponse(null); setPrompt(''); setApplied(false); textareaRef.current?.focus(); }}
            >
              Try a different prompt
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
