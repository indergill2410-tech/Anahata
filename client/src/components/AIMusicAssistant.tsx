import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';

const SUGGESTIONS = [
  'Help me sleep after a stressful day',
  'Deep focus for coding',
  'Heal anxiety and tension',
  'Morning energy boost',
  'Deep meditation session',
  'Creative flow state',
];

interface MixData { name?: string; intention?: string; tags?: string[]; bpm?: number; chaos?: number; settings?: Record<string,unknown>; layers?: Record<string,unknown>; }
interface AIResponse { message: string; mix: MixData | null; }
interface AIMusicAssistantProps { onApplyMix?: (mix: Record<string,unknown>) => void; isPlaying?: boolean; }

const FALLBACKS: Array<{ keys: string[]; mix: AIResponse }> = [
  { keys:['sleep','tired','insomnia','rest','night'], mix:{ message:"Let's ease you into deep, restful sleep. Delta waves + gentle Bansuri guide your mind into stillness.", mix:{ name:'Deep Delta Sleep',intention:'sleep',tags:['sleep','delta'],bpm:55,chaos:0.1, settings:{binaural:{hz:2,carrierHz:200},drone:{type:'tanpura'},instrument:{type:'bansuri'},nature:{type:'ocean'},solfeggio:{hz:396}}, layers:{binaural:{active:true,volume:0.8},drone:{active:true,volume:0.5},instrument:{active:true,volume:0.3},nature:{active:true,volume:0.55},solfeggio:{active:true,volume:0.25}} } } },
  { keys:['focus','coding','study','work','concentrate'], mix:{ message:"Time to enter the flow state. Alpha-Beta beats with crisp Shruti drone sharpen focus without overstimulation.", mix:{ name:'Alpha Flow Focus',intention:'focus',tags:['focus','alpha'],bpm:80,chaos:0.2, settings:{binaural:{hz:10,carrierHz:220},drone:{type:'shruti'},instrument:{type:'sitar'},nature:{type:'forest'},solfeggio:{hz:528}}, layers:{binaural:{active:true,volume:0.75},drone:{active:true,volume:0.45},instrument:{active:false,volume:0},nature:{active:true,volume:0.4},solfeggio:{active:true,volume:0.3}} } } },
  { keys:['anxiety','anxious','stress','stressed','nervous','calm','heal','tension'], mix:{ message:"Your nervous system deserves care. Theta waves + 528Hz Solfeggio melt tension and restore inner calm.", mix:{ name:'Healing Theta Balm',intention:'heal',tags:['healing','theta'],bpm:60,chaos:0.15, settings:{binaural:{hz:6,carrierHz:200},drone:{type:'bowl'},instrument:{type:'bansuri'},nature:{type:'rain'},solfeggio:{hz:528}}, layers:{binaural:{active:true,volume:0.75},drone:{active:true,volume:0.55},instrument:{active:true,volume:0.35},nature:{active:true,volume:0.5},solfeggio:{active:true,volume:0.4}} } } },
  { keys:['energy','morning','motivation','boost','wake','active'], mix:{ message:"Rise and shine! Beta waves and Tabla rhythms ignite your drive for the day.", mix:{ name:'Morning Beta Fire',intention:'energize',tags:['energy','beta'],bpm:100,chaos:0.4, settings:{binaural:{hz:16,carrierHz:250},drone:{type:'shruti'},instrument:{type:'tabla'},nature:{type:'wind'},solfeggio:{hz:417}}, layers:{binaural:{active:true,volume:0.7},drone:{active:true,volume:0.4},instrument:{active:true,volume:0.5},nature:{active:true,volume:0.45},solfeggio:{active:false,volume:0}} } } },
  { keys:['meditate','meditation','peace','deep','spiritual'], mix:{ message:"Sink into the present. Theta Om drone + 852Hz opens the gateway to deep inner stillness.", mix:{ name:'Deep Theta Meditation',intention:'meditate',tags:['meditation','theta'],bpm:65,chaos:0.05, settings:{binaural:{hz:7,carrierHz:210},drone:{type:'om'},instrument:{type:'sarod'},nature:{type:'river'},solfeggio:{hz:852}}, layers:{binaural:{active:true,volume:0.7},drone:{active:true,volume:0.6},instrument:{active:true,volume:0.3},nature:{active:true,volume:0.45},solfeggio:{active:true,volume:0.35}} } } },
  { keys:['creative','art','create','flow','music','write','dream'], mix:{ message:"Let imagination lead. Theta-Alpha blur the boundary between thought and creative flow.", mix:{ name:'Creative Theta Dream',intention:'meditate',tags:['creative','flow'],bpm:70,chaos:0.5, settings:{binaural:{hz:8,carrierHz:200},drone:{type:'tanpura'},instrument:{type:'sitar'},nature:{type:'forest'},solfeggio:{hz:741}}, layers:{binaural:{active:true,volume:0.65},drone:{active:true,volume:0.5},instrument:{active:true,volume:0.4},nature:{active:true,volume:0.5},solfeggio:{active:true,volume:0.3}} } } },
];

function getFallback(prompt: string): AIResponse {
  const l = prompt.toLowerCase();
  for (const f of FALLBACKS) if (f.keys.some(k => l.includes(k))) return f.mix;
  return FALLBACKS[4].mix;
}

export default function AIMusicAssistant({ onApplyMix }: AIMusicAssistantProps) {
  const [prompt,   setPrompt]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [offline,  setOffline]  = useState(false);
  const { success } = useToast();

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setResponse(null);
    setOffline(false);
    try {
      const res = await fetch('/api/ai/mix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text.trim() }),
      });
      if (!res.ok) throw new Error('server');
      setResponse(await res.json());
    } catch {
      setOffline(true);
      setResponse(getFallback(text));
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!response?.mix) return;
    onApplyMix?.(response.mix as Record<string,unknown>);
    success(`Mix applied: ${response.mix.name || 'AI Mix'}`);
  };

  return (
    <div className="ai-assistant">
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
        <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,var(--violet),var(--blue))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 0 14px rgba(112,72,232,0.3)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--ink1)', fontFamily:"'Space Grotesk',sans-serif" }}>AI Music Guide</div>
          <div style={{ fontSize:10, color:'var(--ink3)' }}>Describe your mood or goal</div>
        </div>
      </div>

      <div style={{ display:'flex', gap:8, alignItems:'flex-end', marginBottom:10 }}>
        <textarea
          className="ai-prompt-input"
          placeholder="e.g. I need help focusing after a difficult meeting…"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(prompt);} }}
          rows={2}
          style={{ flex:1 }}
        />
        <button className="ai-send-btn" onClick={()=>send(prompt)} disabled={loading||!prompt.trim()}>
          {loading
            ? <div className="spinner" style={{ width:16, height:16, borderTopColor:'white' }}/>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          }
        </button>
      </div>

      {!response && !loading && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {SUGGESTIONS.map(s => (
            <button key={s} className="ai-chip" onClick={()=>{ setPrompt(s); send(s); }}>{s}</button>
          ))}
        </div>
      )}

      {response && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {offline && (
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 10px', background:'rgba(245,159,0,0.08)', border:'1px solid rgba(245,159,0,0.2)', borderRadius:8, fontSize:11, color:'var(--amber)', fontWeight:600 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Prepared for now
            </div>
          )}
          <div className="ai-typewriter" style={{ fontSize:13 }}>{response.message}</div>
          {response.mix && (
            <div style={{ padding:'12px 14px', background:'var(--bg2)', borderRadius:12, border:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--ink1)', marginBottom:4, fontFamily:"'Space Grotesk',sans-serif" }}>{response.mix.name}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                  {response.mix.tags?.map(tag=>(
                    <span key={tag} style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:'rgba(112,72,232,0.1)', color:'var(--violet)', fontWeight:600 }}>{tag}</span>
                  ))}
                </div>
              </div>
              <button className="btn-primary" style={{ padding:'8px 16px', fontSize:12, flexShrink:0 }} onClick={handleApply}>Apply</button>
            </div>
          )}
          <button className="btn-ghost" style={{ fontSize:11, textAlign:'left' }} onClick={()=>{ setResponse(null); setPrompt(''); setOffline(false); }}>
            Try another prompt
          </button>
        </div>
      )}
    </div>
  );
}
