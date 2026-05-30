import React, { useState } from 'react';
import {
  useSoundEngine,
  INTENTIONS,
  DRONE_OPTIONS,
  INSTRUMENT_OPTIONS,
  NATURE_OPTIONS,
  SOLFEGGIO_OPTIONS,
  BINAURAL_PRESETS,
} from '../context/SoundEngineContext';
import LayerChannel from '../components/LayerChannel';
import MasterBus from '../components/MasterBus';
import SpectrumAnalyser from '../components/SpectrumAnalyser';
import AIMusicAssistant from '../components/AIMusicAssistant';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const BW_COLOR: Record<string, string> = { Delta:'#3B5BDB', Theta:'#7048E8', Alpha:'#0CA678', Beta:'#3B5BDB', Gamma:'#F59F00' };

interface SavedMix { id: string; name: string; created: string; settings?: string; volumes?: string; }

// ── Fallback generation presets (same keyword logic as AI dialog) ─────────────
const GEN_PRESETS = [
  { key:'sleep',    label:'Deep Sleep',      desc:'Delta waves · Tanpura · Ocean',    color:'#3B5BDB', mix:{ intention:'sleep',    settings:{ binaural:{hz:2,carrierHz:180},  drone:{type:'tanpura'}, instrument:{type:'bansuri'}, nature:{type:'ocean'},  solfeggio:{hz:396} }, layers:{ binaural:{active:true,volume:0.8}, drone:{active:true,volume:0.55}, instrument:{active:true,volume:0.3}, nature:{active:true,volume:0.55}, solfeggio:{active:true,volume:0.28} } } },
  { key:'focus',    label:'Deep Focus',      desc:'Alpha waves · Shruti · Forest',    color:'#0CA678', mix:{ intention:'focus',    settings:{ binaural:{hz:10,carrierHz:220}, drone:{type:'shruti'},  instrument:{type:'sitar'},   nature:{type:'forest'}, solfeggio:{hz:528} }, layers:{ binaural:{active:true,volume:0.75},drone:{active:true,volume:0.45},instrument:{active:false,volume:0},  nature:{active:true,volume:0.4},  solfeggio:{active:true,volume:0.3}  } } },
  { key:'heal',     label:'Healing 528Hz',   desc:'Theta waves · Bowl · Rain',        color:'#E64980', mix:{ intention:'heal',     settings:{ binaural:{hz:6,carrierHz:200},  drone:{type:'bowl'},    instrument:{type:'bansuri'}, nature:{type:'rain'},   solfeggio:{hz:528} }, layers:{ binaural:{active:true,volume:0.75},drone:{active:true,volume:0.6}, instrument:{active:true,volume:0.35},nature:{active:true,volume:0.5},  solfeggio:{active:true,volume:0.4}  } } },
  { key:'energize', label:'Morning Energy',  desc:'Beta waves · Shruti · Wind',       color:'#F59F00', mix:{ intention:'energize', settings:{ binaural:{hz:16,carrierHz:250}, drone:{type:'shruti'},  instrument:{type:'tabla'},   nature:{type:'wind'},   solfeggio:{hz:417} }, layers:{ binaural:{active:true,volume:0.7}, drone:{active:true,volume:0.4}, instrument:{active:true,volume:0.5}, nature:{active:true,volume:0.45}, solfeggio:{active:false,volume:0}   } } },
  { key:'meditate', label:'Deep Meditation', desc:'Theta waves · Om · River',         color:'#7048E8', mix:{ intention:'meditate', settings:{ binaural:{hz:7,carrierHz:210},  drone:{type:'om'},      instrument:{type:'sarod'},   nature:{type:'river'},  solfeggio:{hz:852} }, layers:{ binaural:{active:true,volume:0.7}, drone:{active:true,volume:0.65},instrument:{active:true,volume:0.3}, nature:{active:true,volume:0.45}, solfeggio:{active:true,volume:0.35} } } },
];

// Orbiting particle ring used during generation animation
function GenerateOrb({ color, size=72 }: { color:string; size?:number }) {
  return (
    <div style={{ width:size, height:size, position:'relative', flexShrink:0 }}>
      <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:`radial-gradient(circle at 38% 35%, ${color}44, ${color}11 60%, transparent)`, boxShadow:`0 0 24px ${color}55`, animation:'genPulse 1.6s ease-in-out infinite' }}/>
      <div style={{ position:'absolute', inset:6, borderRadius:'50%', border:`1.5px solid ${color}50`, animation:'genSpin 3s linear infinite' }}/>
      <div style={{ position:'absolute', inset:14, borderRadius:'50%', border:`1px solid ${color}30`, animation:'genSpin 5s linear infinite reverse' }}/>
      <div style={{ position:'absolute', inset:'50%', transform:'translate(-50%,-50%)', width:10, height:10, borderRadius:'50%', background:color, boxShadow:`0 0 8px ${color}` }}/>
    </div>
  );
}

export default function StudioPage() {
  const engine = useSoundEngine();
  const { isAuthenticated, token } = useAuth();
  const { success, error }         = useToast();

  const [showSave,    setShowSave]    = useState(false);
  const [showLoad,    setShowLoad]    = useState(false);
  const [mixName,     setMixName]     = useState('');
  const [savedMixes,  setSavedMixes]  = useState<SavedMix[]>([]);
  const [saving,      setSaving]      = useState(false);
  const [generating,  setGenerating]  = useState(false);
  const [genPreset,   setGenPreset]   = useState<typeof GEN_PRESETS[0] | null>(null);
  const [genDone,     setGenDone]     = useState(false);

  const bwColor = BW_COLOR[engine.brainwave] || 'var(--violet)';

  // ── Generate ───────────────────────────────────────────────────────────────
  const handleGenerate = async (preset: typeof GEN_PRESETS[0]) => {
    setGenPreset(preset);
    setGenerating(true);
    setGenDone(false);

    // Try AI first, fall back to preset
    let mix: Record<string, unknown> = preset.mix as Record<string, unknown>;
    try {
      const res = await fetch('/api/ai/mix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: preset.key === 'custom' ? preset.desc : `Generate a ${preset.label} meditation soundscape` }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.mix) mix = data.mix;
      }
    } catch { /* use preset */ }

    // Animate for at least 2s so it feels deliberate
    await new Promise(r => setTimeout(r, 2000));

    const mergedLayers = Object.fromEntries(
      Object.entries(engine.layers).map(([name, currentLayer]) => [
        name,
        { ...currentLayer, ...((mix.layers as Record<string, any>)?.[name] || {}) }
      ])
    );
    engine.applyMix({ ...mix, layers: mergedLayers });
    setGenDone(true);
    await new Promise(r => setTimeout(r, 600));
    engine.start();
    setGenerating(false);
    setGenDone(false);
    success(`${preset.label} soundscape generated ✨`);
  };

  // ── Layer options ──────────────────────────────────────────────────────────
  const LAYER_OPTIONS = {
    binaural:   BINAURAL_PRESETS.map(p => p.hz),
    drone:      DRONE_OPTIONS,
    instrument: INSTRUMENT_OPTIONS,
    nature:     NATURE_OPTIONS,
    solfeggio:  SOLFEGGIO_OPTIONS,
  };
  const currentOption = (name: string) => {
    if (name === 'binaural')   return engine.settings.binaural.hz;
    if (name === 'solfeggio')  return engine.settings.solfeggio.hz;
    if (name === 'drone')      return engine.settings.drone.type;
    if (name === 'instrument') return engine.settings.instrument.type;
    if (name === 'nature')     return engine.settings.nature.type;
  };
  const handleOption = (name: string, val: string) => {
    const v = isNaN(Number(val)) ? val : Number(val);
    if (name === 'binaural') {
      const preset = BINAURAL_PRESETS.find(p => p.hz === v) || BINAURAL_PRESETS[1];
      engine.updateLayerSetting('binaural', 'hz',        preset.hz);
      engine.updateLayerSetting('binaural', 'carrierHz', preset.carrier);
    } else if (name === 'solfeggio') {
      engine.updateLayerSetting('solfeggio', 'hz', v);
    } else {
      engine.updateLayerSetting(name, 'type', v);
    }
  };

  // ── Save mix ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!mixName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/mixes', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify({
          name:     mixName.trim(),
          settings: engine.settings,
          layers:   Object.fromEntries(Object.entries(engine.layers).map(([k,v]) => [k, { volume:v.volume, active:v.active, reverb:v.reverb, pan:v.pan }])),
        }),
      });
      if (!res.ok) throw new Error();
      success('Mix saved!');
      setShowSave(false); setMixName('');
    } catch { error('Failed to save mix.'); }
    finally { setSaving(false); }
  };

  const handleOpenLoad = async () => {
    try {
      const res = await fetch('/api/mixes', { headers: { 'Authorization':`Bearer ${token}` } });
      const data = await res.json();
      setSavedMixes(data.mixes || []);
      setShowLoad(true);
    } catch { error('Could not load mixes.'); }
  };

  const handleLoadMix = (mix: SavedMix) => {
    const loadedLayers = JSON.parse(mix.volumes || "{}");
    const mergedLayers = Object.fromEntries(
      Object.entries(engine.layers).map(([name, currentLayer]) => [
        name,
        { ...currentLayer, ...(loadedLayers[name] || {}) }
      ])
    );
    engine.applyMix({ settings: JSON.parse(mix.settings || "{}"), layers: mergedLayers });
    success(`Loaded: ${mix.name}`);
    setShowLoad(false);
  };

  const handleDeleteMix = async (id: string) => {
    await fetch(`/api/mixes/${id}`, { method:'DELETE', headers:{ 'Authorization':`Bearer ${token}` } });
    setSavedMixes(m => m.filter(x => x.id !== id));
  };

  return (
    <>
    <style>{`
      @keyframes genPulse { 0%,100%{opacity:0.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
      @keyframes genSpin  { to{transform:rotate(360deg)} }
      @keyframes genSlide { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    `}</style>

    <div className="dashboard">

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:20, fontWeight:700, color:'var(--ink1)', margin:0, letterSpacing:'-0.01em' }}>Sound Studio</h2>
          <p style={{ fontSize:12, color:'var(--ink3)', margin:'2px 0 0' }}>Compose your perfect meditation</p>
        </div>
        <span className="bw-chip" style={{ background:`${bwColor}12`, color:bwColor, borderColor:`${bwColor}40` }}>
          {engine.brainwave} · {engine.settings.binaural.hz}Hz
        </span>
      </div>

      {/* ── GENERATE MUSIC ─────────────────────────────────── */}
      <div className="studio-card" style={{ padding:0, overflow:'hidden' }}>
        {/* Hero banner */}
        <div style={{ background:'linear-gradient(135deg,rgba(112,72,232,0.08) 0%,rgba(59,91,219,0.05) 100%)', padding:'20px 20px 16px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <div style={{ width:42, height:42, borderRadius:14, background:'linear-gradient(135deg,var(--violet),var(--blue))', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(112,72,232,0.3)', flexShrink:0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:15, fontWeight:700, color:'var(--ink1)' }}>Generate Music</div>
              <div style={{ fontSize:11, color:'var(--ink3)', marginTop:1 }}>AI-composed meditation soundscape, ready in seconds</div>
            </div>
          </div>

          {/* Preset grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {GEN_PRESETS.map(p => (
              <button
                key={p.key}
                onClick={() => !generating && handleGenerate(p)}
                disabled={generating}
                style={{
                  display:'flex', alignItems:'center', gap:10, padding:'12px 14px',
                  background: engine.intention===p.key ? `${p.color}12` : 'var(--bg1)',
                  border: `1.5px solid ${engine.intention===p.key ? p.color+'50' : 'var(--border)'}`,
                  borderRadius:12, cursor: generating ? 'not-allowed' : 'pointer',
                  textAlign:'left', fontFamily:'inherit', opacity: generating ? 0.6 : 1,
                  transition:'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                  boxShadow: engine.intention===p.key ? `0 4px 14px ${p.color}25` : 'var(--shadow)',
                }}
                onMouseEnter={e => { if(!generating){ e.currentTarget.style.borderColor=p.color+'60'; e.currentTarget.style.transform='translateY(-1px)'; }}}
                onMouseLeave={e => { e.currentTarget.style.borderColor=engine.intention===p.key?p.color+'50':'var(--border)'; e.currentTarget.style.transform='translateY(0)'; }}
              >
                <div style={{ width:36, height:36, borderRadius:10, background:`${p.color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1px solid ${p.color}30` }}>
                  <div style={{ width:14, height:14, borderRadius:'50%', background:p.color, boxShadow:`0 0 8px ${p.color}80` }}/>
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--ink1)', fontFamily:"'Space Grotesk',sans-serif", lineHeight:1.2 }}>{p.label}</div>
                  <div style={{ fontSize:10, color:'var(--ink3)', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.desc}</div>
                </div>
              </button>
            ))}
            {/* Custom / AI prompt tile */}
            <button
              onClick={() => {
                const prompt = window.prompt('Describe the soundscape you want:');
                if (prompt) handleGenerate({ key:'custom', label:'Custom', desc:prompt, color:'#7048E8', mix:{ intention:'meditate', settings:{ binaural:{hz:7,carrierHz:210}, drone:{type:'om'}, instrument:{type:'sarod'}, nature:{type:'river'}, solfeggio:{hz:528} }, layers:{ binaural:{active:true,volume:0.7}, drone:{active:true,volume:0.6}, instrument:{active:true,volume:0.3}, nature:{active:true,volume:0.45}, solfeggio:{active:true,volume:0.35} } } });
              }}
              disabled={generating}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background:'var(--bg1)', border:'1.5px dashed rgba(112,72,232,0.3)', borderRadius:12, cursor: generating?'not-allowed':'pointer', textAlign:'left', fontFamily:'inherit', opacity:generating?0.6:1, transition:'all 0.18s', boxShadow:'none', gridColumn:'span 2 / span 2' }}
              onMouseEnter={e=>{ if(!generating) e.currentTarget.style.borderColor='rgba(112,72,232,0.6)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(112,72,232,0.3)'; }}
            >
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(112,72,232,0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--violet)" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--violet)', fontFamily:"'Space Grotesk',sans-serif" }}>Custom prompt…</div>
                <div style={{ fontSize:10, color:'var(--ink3)', marginTop:2 }}>Describe your mood or goal</div>
              </div>
            </button>
          </div>
        </div>

        {/* Spectrum when playing */}
        {engine.isPlaying && (
          <div style={{ padding:'10px 16px' }}>
            <SpectrumAnalyser analyser={engine.analyser} isPlaying={engine.isPlaying} height={48} />
          </div>
        )}
      </div>

      {/* ── Generation overlay ─────────────────────────────── */}
      {generating && genPreset && (
        <div style={{ position:'fixed', inset:0, zIndex:700, background:'rgba(247,244,238,0.92)', backdropFilter:'blur(20px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:24 }}>
          <GenerateOrb color={genPreset.color} size={96}/>
          <div style={{ textAlign:'center', animation:'genSlide 0.4s ease both' }}>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:20, fontWeight:700, color:'var(--ink1)', letterSpacing:'-0.01em', marginBottom:6 }}>
              {genDone ? 'Ready ✨' : `Composing ${genPreset.label}…`}
            </div>
            <div style={{ fontSize:13, color:'var(--ink3)', maxWidth:260, lineHeight:1.6 }}>
              {genDone ? 'Starting playback' : 'Weaving binaural beats, drone harmonics and sacred frequencies'}
            </div>
          </div>
          {/* Progress dots */}
          {!genDone && (
            <div style={{ display:'flex', gap:8 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:genPreset.color, opacity:0.3, animation:`genPulse 1.2s ease-in-out ${i*0.25}s infinite` }}/>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── AI Assistant ─────────────────────────────────── */}
      <AIMusicAssistant onApplyMix={engine.applyMix} isPlaying={engine.isPlaying} />

      {/* ── Intentions ───────────────────────────────────── */}
      <div className="studio-card">
        <div className="section-title">Intention</div>
        <div className="intention-row">
          {Object.entries(INTENTIONS).map(([key, p]) => (
            <button key={key} className={`intention-btn ${engine.intention === key ? 'active' : ''}`} onClick={() => engine.applyIntention(key)}>
              <span>{p.emoji}</span><span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Master Bus ───────────────────────────────────── */}
      <MasterBus bpm={engine.bpm} chaos={engine.chaos} masterVol={engine.masterVol} isPlaying={engine.isPlaying} ragaName={engine.ragaName} onBpm={engine.setBpm} onChaos={engine.setChaos} onMasterVol={engine.setMasterVolume} onTogglePlay={engine.togglePlay} />

      {/* ── Mixer ────────────────────────────────────────── */}
      <div className="studio-card">
        <div className="section-title" style={{ marginBottom:10 }}>Mixer</div>
        <div className="mixer-grid">
          {['binaural','drone','instrument','nature','solfeggio'].map(name => (
            <LayerChannel key={name} name={name}
              layer={(engine.layers as Record<string, typeof engine.layers['binaural']>)[name]}
              options={(LAYER_OPTIONS as Record<string, (string | number)[]>)[name]}
              currentOption={currentOption(name)}
              onOption={v  => handleOption(name, v)}
              onVolume={v  => engine.setLayerVolume(name, v)}
              onPan={v     => engine.setLayerPan(name, v)}
              onMute={()   => engine.toggleMute(name)}
              onSolo={()   => engine.toggleSolo(name)}
              onReverb={v  => engine.setLayerReverb(name, v)}
              onEQ={(b, v) => engine.setLayerEQ(name, b, v)}
              onActive={v  => engine.setLayerActive(name, v)}
            />
          ))}
        </div>
      </div>

      {/* ── Solfeggio guide ──────────────────────────────── */}
      <div className="studio-card">
        <div className="section-title">Solfeggio Frequencies</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
          {[{hz:174,label:'Pain relief'},{hz:285,label:'Tissue healing'},{hz:396,label:'Release fear'},{hz:417,label:'Change'},{hz:528,label:'DNA repair'},{hz:639,label:'Relationships'},{hz:741,label:'Intuition'},{hz:852,label:'Spiritual'},{hz:963,label:'Crown'}].map(s => (
            <button key={s.hz} onClick={() => engine.updateLayerSetting('solfeggio','hz',s.hz)}
              style={{ padding:'5px 10px', borderRadius:'var(--rf)', fontSize:10, fontFamily:'inherit', border:`1px solid ${engine.settings.solfeggio.hz===s.hz?'var(--amber)':'var(--border)'}`, background:engine.settings.solfeggio.hz===s.hz?'rgba(245,159,0,0.08)':'var(--bg1)', color:engine.settings.solfeggio.hz===s.hz?'var(--amber)':'var(--ink3)', cursor:'pointer', transition:'all 0.15s' }}>
              {s.hz}Hz · {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Save / Load ───────────────────────────────────── */}
      {isAuthenticated && (
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn-secondary" style={{ flex:1 }} onClick={() => setShowSave(true)}>Save Mix</button>
          <button className="btn-secondary" style={{ flex:1 }} onClick={handleOpenLoad}>Load Mix</button>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────── */}
      {showSave && (
        <div className="modal-overlay" onClick={() => setShowSave(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:17, marginBottom:16 }}>Save Mix</h3>
            <div className="form-group">
              <label className="form-label">Mix Name</label>
              <input type="text" placeholder="e.g. Deep Sleep Sunday…" value={mixName} onChange={e => setMixName(e.target.value)} onKeyDown={e => e.key==='Enter'&&handleSave()} autoFocus/>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              <button className="btn-secondary" style={{ flex:1 }} onClick={() => setShowSave(false)}>Cancel</button>
              <button className="btn-primary"   style={{ flex:2 }} onClick={handleSave} disabled={saving}>{saving?'Saving…':'Save'}</button>
            </div>
          </div>
        </div>
      )}
      {showLoad && (
        <div className="modal-overlay" onClick={() => setShowLoad(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:17, marginBottom:16 }}>Saved Mixes</h3>
            {savedMixes.length===0
              ? <p style={{ fontSize:13, color:'var(--t3)', textAlign:'center', padding:'20px 0' }}>No saved mixes yet.</p>
              : savedMixes.map(mix => (
                <div key={mix.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--t1)' }}>{mix.name}</div>
                    <div style={{ fontSize:10, color:'var(--t4)' }}>{new Date(mix.created).toLocaleDateString()}</div>
                  </div>
                  <button className="btn-secondary" style={{ padding:'6px 14px', fontSize:12 }} onClick={() => handleLoadMix(mix)}>Load</button>
                  <button className="btn-ghost"     style={{ padding:'6px 10px', fontSize:12, color:'var(--red)' }} onClick={() => handleDeleteMix(mix.id)}>✕</button>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
    </>
  );
}

