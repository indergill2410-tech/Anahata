import React from 'react';

const TABS = [
  {
    id: 'dashboard',
    label: 'Meditate',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1l2.1-2.1M17 7l2.1-2.1"/>
      </svg>
    )
  },
  {
    id: 'sessions',
    label: 'History',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    )
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    )
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
