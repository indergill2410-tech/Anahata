import React, { useState } from 'react';
import {
  useSoundEngine,
  INTENTIONS,
  DRONE_OPTIONS,
  INSTRUMENT_OPTIONS,
  NATURE_OPTIONS,
  SOLFEGGIO_OPTIONS,
  BINAURAL_PRESETS,
  BW_FOR_HZ,
} from '../context/SoundEngineContext';
import LayerChannel from '../components/LayerChannel';
import MasterBus from '../components/MasterBus';
import SpectrumAnalyser from '../components/SpectrumAnalyser';
import AIMusicAssistant from '../components/AIMusicAssistant';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const BW_COLOR: Record<string, string> = { Delta:'#4A7FA5', Theta:'#9B6B9A', Alpha:'#7B8B5E', Beta:'#4A7FA5', Gamma:'#D4A853' };

interface SavedMix { id: string; name: string; created: string; settings?: string; volumes?: string; }

export default function StudioPage() {
  const engine = useSoundEngine();
  const { isAuthenticated, token } = useAuth();
  const { success, error, info }   = useToast();

  const [showSave,    setShowSave]    = useState(false);
  const [showLoad,    setShowLoad]    = useState(false);
  const [mixName,     setMixName]     = useState('');
  const [savedMixes,  setSavedMixes]  = useState<SavedMix[]>([]);
  const [saving,      setSaving]      = useState(false);

  const bwColor = BW_COLOR[engine.brainwave] || 'var(--accent)';

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

  // ── Load mixes ─────────────────────────────────────────────────────────────
  const handleOpenLoad = async () => {
    try {
      const res = await fetch('/api/mixes', { headers: { 'Authorization':`Bearer ${token}` } });
      const data = await res.json();
      setSavedMixes(data.mixes || []);
      setShowLoad(true);
    } catch { error('Could not load mixes.'); }
  };

  const handleLoadMix = (mix: SavedMix) => {
    engine.applyMix({
      settings: JSON.parse(mix.settings || '{}'),
      layers:   JSON.parse(mix.volumes  || '{}'),
    });
    success(`Loaded: ${mix.name}`);
    setShowLoad(false);
  };

  const handleDeleteMix = async (id: string) => {
    await fetch(`/api/mixes/${id}`, { method:'DELETE', headers:{ 'Authorization':`Bearer ${token}` } });
    setSavedMixes(m => m.filter(x => x.id !== id));
  };

  return (
    <div className="dashboard">

      {/* ── Brainwave header ─────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:4 }}>
        <div>
          <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:18, color:'var(--t1)', marginBottom:2 }}>Sound Studio</h2>
          <p style={{ fontSize:11, color:'var(--t3)' }}>Mix your perfect soundscape</p>
        </div>
        <span className="bw-chip" style={{ background:`${bwColor}12`, color:bwColor, borderColor:`${bwColor}40` }}>
          {engine.brainwave} · {engine.settings.binaural.hz}Hz
        </span>
      </div>

      {/* ── AI Assistant ─────────────────────────────────── */}
      <AIMusicAssistant onApplyMix={engine.applyMix} isPlaying={engine.isPlaying} />

      {/* ── Intentions ───────────────────────────────────── */}
      <div className="studio-card">
        <div className="section-title">Intention</div>
        <div className="intention-row">
          {Object.entries(INTENTIONS).map(([key, p]) => (
            <button
              key={key}
              className={`intention-btn ${engine.intention === key ? 'active' : ''}`}
              onClick={() => engine.applyIntention(key)}
            >
              <span>{p.emoji}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Master Bus ───────────────────────────────────── */}
      <MasterBus
        bpm={engine.bpm}
        chaos={engine.chaos}
        masterVol={engine.masterVol}
        isPlaying={engine.isPlaying}
        ragaName={engine.ragaName}
        onBpm={engine.setBpm}
        onChaos={engine.setChaos}
        onMasterVol={engine.setMasterVolume}
        onTogglePlay={engine.togglePlay}
      />

      {/* ── Spectrum analyser ────────────────────────────── */}
      {engine.isPlaying && (
        <div className="studio-card" style={{ padding:'12px 16px' }}>
          <SpectrumAnalyser analyser={engine.analyser} isPlaying={engine.isPlaying} height={56} />
        </div>
      )}

      {/* ── Mixer ────────────────────────────────────────── */}
      <div className="studio-card">
        <div className="section-title" style={{ marginBottom:10 }}>Mixer</div>
        <div className="mixer-grid">
          {['binaural','drone','instrument','nature','solfeggio'].map(name => (
            <LayerChannel
              key={name}
              name={name}
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

      {/* ── Frequency guide ──────────────────────────────── */}
      <div className="studio-card">
        <div className="section-title">Frequency Guide</div>
        <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:4 }}>
          {[
            { label:'Delta', hz:'1–4Hz', desc:'Deep sleep, restoration', color:'#4A7FA5' },
            { label:'Theta', hz:'4–8Hz', desc:'Meditation, creativity',   color:'#9B6B9A' },
            { label:'Alpha', hz:'8–13Hz',desc:'Calm focus, relaxation',   color:'#7B8B5E' },
            { label:'Beta',  hz:'13–30Hz',desc:'Active thinking, energy', color:'#4A7FA5' },
            { label:'Gamma', hz:'30+Hz', desc:'Peak cognition, insight',  color:'#D4A853' },
          ].map(row => (
            <div key={row.label} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
              <span className="badge" style={{ background:`${row.color}12`, color:row.color, borderColor:`${row.color}30`, minWidth:52, justifyContent:'center', fontSize:10 }}>{row.label}</span>
              <span style={{ fontSize:11, fontWeight:600, color:'var(--t2)', width:52 }}>{row.hz}</span>
              <span style={{ fontSize:11, color:'var(--t3)' }}>{row.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Solfeggio guide ──────────────────────────────── */}
      <div className="studio-card">
        <div className="section-title">Solfeggio Frequencies</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
          {[
            {hz:174,label:'Pain relief'},{hz:285,label:'Tissue healing'},{hz:396,label:'Release fear'},
            {hz:417,label:'Change'},{hz:528,label:'DNA repair'},{hz:639,label:'Relationships'},
            {hz:741,label:'Intuition'},{hz:852,label:'Spiritual'},{hz:963,label:'Crown'},
          ].map(s => (
            <button
              key={s.hz}
              onClick={() => engine.updateLayerSetting('solfeggio','hz',s.hz)}
              style={{
                padding:'5px 10px', borderRadius:'var(--r-full)', fontSize:10, fontFamily:'inherit',
                border:`1px solid ${engine.settings.solfeggio.hz === s.hz ? 'var(--gold)' : 'var(--border)'}`,
                background: engine.settings.solfeggio.hz === s.hz ? 'var(--gold-low)' : '#fff',
                color: engine.settings.solfeggio.hz === s.hz ? 'var(--gold)' : 'var(--t3)',
                cursor:'pointer', transition:'all 0.15s',
              }}
            >
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

      {/* ── Save modal ───────────────────────────────────── */}
      {showSave && (
        <div className="modal-overlay" onClick={() => setShowSave(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:17, marginBottom:16 }}>Save Mix</h3>
            <div className="form-group">
              <label className="form-label">Mix Name</label>
              <input
                type="text"
                placeholder="e.g. Deep Sleep Sunday…"
                value={mixName}
                onChange={e => setMixName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                autoFocus
              />
            </div>
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              <button className="btn-secondary" style={{ flex:1 }} onClick={() => setShowSave(false)}>Cancel</button>
              <button className="btn-primary"   style={{ flex:2 }} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Load modal ────────────────────────────────────── */}
      {showLoad && (
        <div className="modal-overlay" onClick={() => setShowLoad(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:17, marginBottom:16 }}>Saved Mixes</h3>
            {savedMixes.length === 0
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
  );
}
