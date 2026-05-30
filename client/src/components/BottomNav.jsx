import React from 'react';

const TABS = [
  {
    id: 'journey', label: 'Journey',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1l2.1-2.1M17 7l2.1-2.1"/></svg>
  },
  {
    id: 'studio', label: 'Studio',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="8" y1="6" x2="8" y2="18"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="16" y1="9" x2="16" y2="18"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="10" y1="7" x2="14" y2="7"/><line x1="14" y1="14" x2="18" y2="14"/></svg>
  },
  {
    id: 'sessions', label: 'History',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
  },
  {
    id: 'profile', label: 'Profile',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  }
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {TABS.map(tab => (
          <button key={tab.id} className={`nav-item${active === tab.id ? ' active' : ''}`} onClick={() => onChange(tab.id)}>
            {tab.icon}
            {tab.label}
            <div className="nav-dot" />
          </button>
        ))}
      </div>
    </nav>
  );
}
