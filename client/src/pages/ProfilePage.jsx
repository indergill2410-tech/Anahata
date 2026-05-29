import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [binauralOn, setBinauralOn] = useState(true);
  const [notificationsOn, setNotificationsOn] = useState(false);

  const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <div className="dashboard fade-in">
      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div className="profile-avatar">{initials}</div>
          <div>
            <p style={{ fontWeight: 500, fontSize: 15 }}>{user?.name || 'User'}</p>
            <p className="text-subtle" style={{ fontSize: 13 }}>{user?.email}</p>
          </div>
        </div>

        <span className="card-label">Preferences</span>

        <div className="settings-row" onClick={() => setBinauralOn(v => !v)}>
          <span className="settings-row-label">Binaural beats</span>
          <div className={`toggle${binauralOn ? ' on' : ''}`}><div className="toggle-thumb" /></div>
        </div>

        <div className="settings-row" onClick={() => setNotificationsOn(v => !v)}>
          <span className="settings-row-label">Session reminders</span>
          <div className={`toggle${notificationsOn ? ' on' : ''}`}><div className="toggle-thumb" /></div>
        </div>

        <div className="settings-row">
          <span className="settings-row-label">Target resting heart rate</span>
          <span className="settings-row-value">60 BPM <span style={{ color: 'var(--t3)' }}>›</span></span>
        </div>

        <div className="settings-row">
          <span className="settings-row-label">Preferred music style</span>
          <span className="settings-row-value">Classical <span style={{ color: 'var(--t3)' }}>›</span></span>
        </div>
      </div>

      <div className="card">
        <span className="card-label">Account</span>
        <div className="settings-row">
          <span className="settings-row-label">App version</span>
          <span className="settings-row-value">1.0.0</span>
        </div>
        <div className="settings-row">
          <span className="settings-row-label">Privacy policy</span>
          <span className="settings-row-value">›</span>
        </div>
        <div style={{ paddingTop: 16 }}>
          <button className="btn btn-danger btn-full" onClick={logout}>Sign out</button>
        </div>
      </div>
    </div>
  );
}
