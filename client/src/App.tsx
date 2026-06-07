import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SoundEngineProvider, useSoundEngine } from './context/SoundEngineContext';
import ErrorBoundary from './components/ErrorBoundary';
import AntiGravityCanvas from './components/AntiGravityCanvas';
import AIMixDialog from './components/AIMixDialog';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import OnboardingPage from './pages/OnboardingPage';
import JourneyPage from './pages/JourneyPage';
import LibraryPage from './pages/LibraryPage';
import StudioPage from './pages/StudioPage';
import SessionsPage from './pages/SessionsPage';
import ProfilePage from './pages/ProfilePage';
import JournalPage from './pages/JournalPage';
import BottomNav from './components/BottomNav';
import TopBar from './components/TopBar';

type Tab = 'journey' | 'library' | 'studio' | 'journal' | 'profile';

function AuthPrompt({ onSignIn, tab }: { onSignIn: () => void; tab: string }) {
  const label = tab === 'profile' ? 'your dashboard' : 'your session history';
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      flex:1, padding:'48px 24px', textAlign:'center', gap:16 }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(112,72,232,0.1)', border: '1px solid rgba(112,72,232,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--violet)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      </div>
      <h2 style={{ fontSize:20, fontWeight:800, color:'var(--t1)', margin:0, letterSpacing:'0' }}>
        Sign in to view {label}
      </h2>
      <p style={{ fontSize:13, color:'var(--t3)', margin:0, maxWidth:280 }}>
        Create a free account or sign in to unlock private data, saved journals, sessions, and dashboard memory.
      </p>
      <button onClick={onSignIn} className="btn-primary" style={{ marginTop:8 }}>
        Sign in / Register
      </button>
    </div>
  );
}

function AIFloatButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="ai-float-btn" onClick={onClick} title="AI Music Guide">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    </button>
  );
}

function Inner() {
  const { isAuthenticated, loading } = useAuth();
  const engine = useSoundEngine();
  const [tab, setTab] = useState<Tab>('journey');
  const [prevTab, setPrevTab] = useState<Tab>('journey');
  const [seenLanding, setSeenLanding] = useState(false);
  const [onboarded, setOnboarded] = useState(!!localStorage.getItem('anahata_onboarded'));
  const [showAuth, setShowAuth] = useState(false);
  const [showAI, setShowAI] = useState(false);

  React.useEffect(() => { if (isAuthenticated) setShowAuth(false); }, [isAuthenticated]);

  const isPopState = React.useRef(false);
  const isInitialTab = React.useRef(true);

  React.useEffect(() => {
    if (!seenLanding) return;
    window.history.replaceState({ tab }, '', window.location.pathname);
  }, [seenLanding]);

  React.useEffect(() => {
    if (!seenLanding) return;
    if (isInitialTab.current) { isInitialTab.current = false; return; }
    if (isPopState.current) { isPopState.current = false; return; }
    window.history.pushState({ tab }, '', window.location.pathname);
  }, [tab, seenLanding]);

  React.useEffect(() => {
    if (!seenLanding) return;
    const onPop = (e: PopStateEvent) => {
      const prev = (e.state as { tab?: Tab } | null)?.tab;
      if (prev && prev !== tab) {
        isPopState.current = true;
        setPrevTab(tab);
        setTab(prev);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [tab, seenLanding]);

  const handleTabChange = (next: Tab) => { setPrevTab(tab); setTab(next); };
  const handleBack = () => { setTab(prevTab === tab ? 'journey' : prevTab); setPrevTab('journey'); };
  const openAuth = () => setShowAuth(true);

  if (loading) {
    return (
      <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', flexDirection:'column', gap:16 }}>
        <div style={{ fontFamily:"'Space Grotesk', sans-serif", fontSize:22, fontWeight:700, color:'var(--blue)', letterSpacing:'0.14em' }}>
          ANAHATA
        </div>
        <div className="spinner" style={{ width:24, height:24 }} />
      </div>
    );
  }

  if (!seenLanding) return <LandingPage onEnter={() => setSeenLanding(true)} />;
  if (showAuth && !isAuthenticated) return <AuthPage onBack={() => setShowAuth(false)} />;
  if (isAuthenticated && !onboarded) return <OnboardingPage onComplete={() => setOnboarded(true)} />;

  const PROTECTED: Tab[] = ['profile'];
  const needsAuth = PROTECTED.includes(tab) && !isAuthenticated;

  const PAGES: Record<Tab, React.ComponentType<Record<string, unknown>>> = {
    journey: JourneyPage,
    library: LibraryPage,
    studio: StudioPage,
    journal: JournalPage,
    profile: ProfilePage,
  };
  const Page = PAGES[tab];
  const pageProps: Record<string, unknown> = tab === 'library'
    ? { onTabChange: handleTabChange }
    : tab === 'journal'
      ? { onRequireAuth: openAuth }
      : {};

  return (
    <>
      <AntiGravityCanvas brainwave={engine.brainwave} isPlaying={engine.isPlaying} bpm={engine.bpm} />

      <div className="page">
        <TopBar tab={tab} onSignIn={openAuth} onBack={tab !== 'journey' ? handleBack : undefined} />
        <ErrorBoundary>
          <div key={tab} className="page-enter" style={{ flex:1, display:'flex', flexDirection:'column' }}>
            {needsAuth
              ? <AuthPrompt onSignIn={openAuth} tab={tab} />
              : <Page {...pageProps} />
            }
          </div>
        </ErrorBoundary>
        <BottomNav active={tab} onChange={handleTabChange} />
      </div>

      <AIFloatButton onClick={() => setShowAI(true)} />

      {showAI && (
        <AIMixDialog
          onClose={() => setShowAI(false)}
          onApplyMix={(mix) => { engine.applyMix(mix as Record<string, unknown>); setShowAI(false); }}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <SoundEngineProvider>
            <Inner />
          </SoundEngineProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
