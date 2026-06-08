import React, { useRef, useEffect, useState } from 'react';

type Tab = 'journey' | 'library' | 'studio' | 'journal' | 'profile';
interface Props { active: string; onChange: (tab: Tab) => void; }

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'journey', label: 'Home', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1l2.1-2.1M17 7l2.1-2.1"/></svg> },
  { id: 'studio', label: 'Studio', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="8" y1="6" x2="8" y2="18"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="16" y1="9" x2="16" y2="18"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="10" y1="7" x2="14" y2="7"/><line x1="14" y1="14" x2="18" y2="14"/></svg> },
  { id: 'journal', label: 'Journal', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> },
  { id: 'library', label: 'Library', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
  { id: 'profile', label: 'You', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
];

export default function BottomNav({ active, onChange }: Props) {
  const pillRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    function updateIndicator() {
      const nav = navRef.current;
      if (!nav) return;
      const idx = TABS.findIndex(t => t.id === active);
      const btn = nav.querySelectorAll<HTMLButtonElement>('.fnav-btn')[idx];
      if (!btn) return;
      const navRect = nav.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setIndicatorStyle({
        left: btnRect.left - navRect.left + btnRect.width / 2 - 16,
        width: 32,
      });
    }
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    window.addEventListener('orientationchange', updateIndicator);
    return () => {
      window.removeEventListener('resize', updateIndicator);
      window.removeEventListener('orientationchange', updateIndicator);
    };
  }, [active]);

  return (
    <div className="fnav-wrap">
      <div className="fnav-pill" ref={pillRef}>
        <div ref={navRef} className="fnav-inner">
          <div
            className="fnav-indicator"
            style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
          />
          {TABS.map(tab => {
            const isActive = tab.id === active;
            return (
              <button
                key={tab.id}
                className={`fnav-btn ${isActive ? 'active' : ''}`}
                onClick={() => onChange(tab.id)}
                aria-label={tab.id === 'profile' ? 'Your dashboard' : tab.label}
              >
                <span className="fnav-icon">{tab.icon}</span>
                <span className="fnav-label">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
