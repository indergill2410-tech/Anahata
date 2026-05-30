import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function Toggle({ label, desc, value, onChange }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0',
      borderBottom:'1px solid var(--border)' }}>
      <div>
        <p style={{ fontSize:13, fontWeight:500, color:'var(--t1)' }}>{label}</p>
        {desc && <p style={{ fontSize:11, color:'var(--t3)', marginTop:2 }}>{desc}</p>}
      </div>
      <button onClick={() => onChange(!value)} style={{
        width:44, height:24, borderRadius:12, border:'none', cursor:'pointer',
        background: value ? 'var(--accent)' : 'var(--bg-3)',
        position:'relative', transition:'background var(--dur) var(--ease)',
        flexShrink:0
      }}>
        <span style={{
          position:'absolute', top:3, left: value ? 23 : 3,
          width:18, height:18, borderRadius:'50%', background:'white',
          transition:'left var(--dur) var(--ease)', display:'block'
        }} />
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { success }      = useToast();
  const [prefs, setPrefs] = useState({
    binaural:    JSON.parse(localStorage.getItem('pref_binaural')  ?? 'true'),
    reminders:   JSON.parse(localStorage.getItem('pref_reminders') ?? 'false'),
    haptics:     JSON.parse(localStorage.getItem('pref_haptics')   ?? 'true'),
    autoSession: JSON.parse(localStorage.getItem('pref_autoSession') ?? 'false'),
  });

  function setPref(key, val) {
    setPrefs(p => ({ ...p, [key]: val }));
    localStorage.setItem(`pref_${key}`, JSON.stringify(val));
    success('Preference saved');
  }

  return (
    <div className="dashboard fade-in">
      {/* User card */}
      <div className="card" style={{ padding:'20px 18px', display:'flex', alignItems:'center', gap:14 }}>
        <div style={{
          width:48, height:48, borderRadius:'50%',
          background:'var(--accent-low)', border:'1px solid rgba(109,74,255,0.3)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:18, fontWeight:600, color:'var(--accent-hi)', flexShrink:0
        }}>
          {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
        </div>
        <div style={{ minWidth:0 }}>
          <p style={{ fontSize:15, fontWeight:500, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {user?.name || 'Meditator'}
          </p>
          <p style={{ fontSize:12, color:'var(--t3)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {user?.email}
          </p>
        </div>
      </div>

      {/* Preferences */}
      <div className="card" style={{ padding:'0 18px' }}>
        <Toggle label="Binaural Beats"    desc="Stereo headphones required"    value={prefs.binaural}    onChange={v => setPref('binaural', v)} />
        <Toggle label="Daily Reminders"   desc="Notify me to meditate each day" value={prefs.reminders}   onChange={v => setPref('reminders', v)} />
        <Toggle label="Haptic Feedback"   desc="Vibrate on connect events"     value={prefs.haptics}     onChange={v => setPref('haptics', v)} />
        <Toggle label="Auto-start Session" desc="Begin when watch connects"    value={prefs.autoSession} onChange={v => setPref('autoSession', v)} />
      </div>

      {/* App info */}
      <div className="card" style={{ padding:'14px 18px' }}>
        <p style={{ fontSize:11, color:'var(--t3)', lineHeight:1.8 }}>
          Anahata v1.0.0<br/>
          111 meditation tracks<br/>
          Binaural beats · Indian classical · Solfeggio
        </p>
      </div>

      {/* Sign out */}
      <button className="btn" onClick={logout} style={{
        width:'100%', height:44, fontSize:13, fontWeight:500,
        color:'#f87171', background:'rgba(248,113,113,0.07)',
        border:'1px solid rgba(248,113,113,0.2)', borderRadius:'var(--r-md)'
      }}>
        Sign Out
      </button>
    </div>
  );
}
