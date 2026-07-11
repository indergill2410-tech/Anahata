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

// ─── Client-side fallback mix generator ──────────────────────────────────────
const KEYWORD_PRESETS: Array<{ keys: string[]; mix: AIResponse }> = [
  {
    keys: ['sleep','tired','insomnia','rest','night'],
    mix: {
      message: "Let's ease you into a deep, restful sleep. This Delta-wave blend uses slow Bansuri tones and gentle ocean sounds to guide your mind into stillness.",
      mix: { name:'Deep Delta Sleep', intention:'sleep', tags:['sleep','delta','calm'], bpm:55, chaos:0.1,
        settings:{ binaural:{hz:2,carrierHz:200}, drone:{type:'tanpura'}, instrument:{type:'bansuri'}, nature:{type:'ocean'}, solfeggio:{hz:396} },
        layers:{ binaural:{active:true,volume:0.8,reverb:0.1}, drone:{active:true,volume:0.5,reverb:0.2}, instrument:{active:true,volume:0.3,reverb:0.35}, nature:{active:true,volume:0.55,reverb:0.15}, solfeggio:{active:true,volume:0.25,reverb:0.4} } },
    },
  },
  {
    keys: ['focus','coding','study','work','concentrate','productivity'],
    mix: {
      message: "Time to enter the flow state. Alpha-Beta binaural beats with crisp Shruti drone will sharpen your focus without overstimulating.",
      mix: { name:'Alpha Flow Focus', intention:'focus', tags:['focus','alpha','clarity'], bpm:80, chaos:0.2,
        settings:{ binaural:{hz:10,carrierHz:220}, drone:{type:'shruti'}, instrument:{type:'sitar'}, nature:{type:'forest'}, solfeggio:{hz:528} },
        layers:{ binaural:{active:true,volume:0.75,reverb:0.08}, drone:{active:true,volume:0.45,reverb:0.15}, instrument:{active:false,volume:0,reverb:0.2}, nature:{active:true,volume:0.4,reverb:0.12}, solfeggio:{active:true,volume:0.3,reverb:0.35} } },
    },
  },
  {
    keys: ['anxiety','anxious','stress','stressed','nervous','worry','calm','heal'],
    mix: {
      message: "Your nervous system deserves some care. Theta waves and 528Hz Solfeggio combine to melt tension and restore inner calm.",
      mix: { name:'Healing Theta Balm', intention:'heal', tags:['healing','theta','anxiety','calm'], bpm:60, chaos:0.15,
        settings:{ binaural:{hz:6,carrierHz:200}, drone:{type:'bowl'}, instrument:{type:'bansuri'}, nature:{type:'rain'}, solfeggio:{hz:528} },
        layers:{ binaural:{active:true,volume:0.75,reverb:0.12}, drone:{active:true,volume:0.55,reverb:0.25}, instrument:{active:true,volume:0.35,reverb:0.3}, nature:{active:true,volume:0.5,reverb:0.15}, solfeggio:{active:true,volume:0.4,reverb:0.4} } },
    },
  },
  {
    keys: ['energy','morning','motivation','boost','wake','active','gym'],
    mix: {
      message: "Rise and shine! Beta waves and Tabla rhythms will ignite your energy and drive for the day ahead.",
      mix: { name:'Morning Beta Fire', intention:'energize', tags:['energy','beta','morning'], bpm:100, chaos:0.4,
        settings:{ binaural:{hz:16,carrierHz:250}, drone:{type:'shruti'}, instrument:{type:'tabla'}, nature:{type:'wind'}, solfeggio:{hz:417} },
        layers:{ binaural:{active:true,volume:0.7,reverb:0.06}, drone:{active:true,volume:0.4,reverb:0.1}, instrument:{active:true,volume:0.5,reverb:0.15}, nature:{active:true,volume:0.45,reverb:0.1}, solfeggio:{active:false,volume:0,reverb:0.3} } },
    },
  },
  {
    keys: ['meditate','meditation','peace','inner','deep','spiritual','soul'],
    mix: {
      message: "Sink into the present moment. A pure Theta Om drone with 852Hz Solfeggio opens the gateway to deep inner stillness.",
      mix: { name:'Deep Theta Meditation', intention:'meditate', tags:['meditation','theta','peace'], bpm:65, chaos:0.05,
        settings:{ binaural:{hz:7,carrierHz:210}, drone:{type:'om'}, instrument:{type:'sarod'}, nature:{type:'river'}, solfeggio:{hz:852} },
        layers:{ binaural:{active:true,volume:0.7,reverb:0.1}, drone:{active:true,volume:0.6,reverb:0.3}, instrument:{active:true,volume:0.3,reverb:0.4}, nature:{active:true,volume:0.45,reverb:0.2}, solfeggio:{active:true,volume:0.35,reverb:0.45} } },
    },
  },
  {
    keys: ['creative','art','create','flow','music','write','dream'],
    mix: {
      message: "Let imagination take the wheel. Theta-Alpha waves blur the boundary between conscious thought and creative flow.",
      mix: { name:'Creative Theta Dream', intention:'meditate', tags:['creative','theta','flow'], bpm:70, chaos:0.5,
        settings:{ binaural:{hz:8,carrierHz:200}, drone:{type:'tanpura'}, instrument:{type:'sitar'}, nature:{type:'forest'}, solfeggio:{hz:741} },
        layers:{ binaural:{active:true,volume:0.65,reverb:0.12}, drone:{active:true,volume:0.5,reverb:0.2}, instrument:{active:true,volume:0.4,reverb:0.3}, nature:{active:true,volume:0.5,reverb:0.15}, solfeggio:{active:true,volume:0.3,reverb:0.4} } },
    },
  },
  {
    keys: ['grief','sad','sadness','emotional','release','cry','loss'],
    mix: {
      message: "It's okay to feel. This gentle 396Hz blend creates a safe space to process and release what you're carrying.",
      mix: { name:'Gentle Release', intention:'heal', tags:['healing','grief','release'], bpm:58, chaos:0.1,
        settings:{ binaural:{hz:5,carrierHz:180}, drone:{type:'bowl'}, instrument:{type:'bansuri'}, nature:{type:'rain'}, solfeggio:{hz:396} },
        layers:{ binaural:{active:true,volume:0.7,reverb:0.15}, drone:{active:true,volume:0.5,reverb:0.3}, instrument:{active:true,volume:0.3,reverb:0.4}, nature:{active:true,volume:0.6,reverb:0.2}, solfeggio:{active:true,volume:0.4,reverb:0.45} } },
    },
  },
  {
    keys: ['headache','pain','body','ache','tension','relax','relaxation'],
    mix: {
      message: "Relief is on the way. 174Hz Solfeggio combined with Delta waves target physical tension and promote full-body relaxation.",
      mix: { name:'174Hz Body Relief', intention:'heal', tags:['healing','pain','relax'], bpm:52, chaos:0.08,
        settings:{ binaural:{hz:3,carrierHz:180}, drone:{type:'bowl'}, instrument:{type:'bansuri'}, nature:{type:'ocean'}, solfeggio:{hz:174} },
        layers:{ binaural:{active:true,volume:0.75,reverb:0.1}, drone:{active:true,volume:0.55,reverb:0.25}, instrument:{active:false,volume:0,reverb:0.3}, nature:{active:true,volume:0.6,reverb:0.15}, solfeggio:{active:true,volume:0.45,reverb:0.4} } },
    },
  },
];

function getFallbackMix(prompt: string): AIResponse {
  const lower = prompt.toLowerCase();
  for (const preset of KEYWORD_PRESETS) {
    if (preset.keys.some(k => lower.includes(k))) return preset.mix;
  }
  // Default: meditation
  return KEYWORD_PRESETS.find(p => p.keys.includes('meditate'))?.mix || KEYWORD_PRESETS[0].mix;
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
  const [prompt,    setPrompt]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [response,  setResponse]  = useState<AIResponse | null>(null);
  const [applied,   setApplied]   = useState(false);
  const [offline,   setOffline]   = useState(false);
  const { success } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setTimeout(() => textareaRef.current?.focus(), 400); }, []);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setResponse(null);
    setApplied(false);
    setOffline(false);
    try {
      const res = await fetch('/api/ai/mix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text.trim() }),
      });
      if (!res.ok) throw new Error('server');
      const data = await res.json();
      if (!data || typeof data.message !== 'string') {
        throw new Error('invalid response format');
      }
      setResponse(data as AIResponse);
    } catch {
      // Server unavailable or API key missing — use client-side fallback
      setOffline(true);
      setResponse(getFallbackMix(text));
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
            {/* Offline badge */}
            {offline && (
              <div style={{
                display:'flex', alignItems:'center', gap:6, padding:'7px 12px',
                background:'rgba(245,159,0,0.1)', border:'1px solid rgba(245,159,0,0.25)',
                borderRadius:10, marginBottom:12, fontSize:11, color:'#F59F00', fontWeight:600,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Prepared a gentle mix for now
              </div>
            )}
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

                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  {response.mix.bpm && (
                    <span style={{ borderRadius: 999, padding: '7px 11px', border: '1px solid rgba(212,168,83,0.3)', background: 'rgba(212,168,83,0.1)', color: 'var(--neon-gold)', fontSize: 11, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
                      {response.mix.bpm} BPM
                    </span>
                  )}
                  {response.mix.intention && (
                    <span style={{ borderRadius: 999, padding: '7px 11px', border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                      {response.mix.intention}
                    </span>
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
