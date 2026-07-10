import React, { useState, Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SoundEngineProvider, useSoundEngine } from './context/SoundEngineContext';
import { TrackPlayerProvider } from './context/TrackPlayerContext';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalTrackPlayer from './components/GlobalTrackPlayer';
import LandingPage from './pages/LandingPage';
import BottomNav from './components/BottomNav';
import TopBar from './components/TopBar';
import MobileInstallPrompt from './components/MobileInstallPrompt';

const AIMixDialog = lazy(() => import('./components/AIMixDialog'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const JourneyPage = lazy(() => import('./pages/JourneyPage'));
const LibraryPage = lazy(() => import('./pages/LibraryPage'));
const StudioPage = lazy(() => import('./pages/StudioPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const JournalPage = lazy(() => import('./pages/JournalPage'));

type Tab = 'journey' | 'library' | 'studio' | 'journal' | 'profile';
type PageProps = Record<string, unknown>;

const TAB_ORDER: Tab[] = ['journey', 'library', 'studio', 'journal', 'profile'];

function readRequestedTab(): Tab | null {
  if (typeof window === 'undefined') return null;
  const requested = new URLSearchParams(window.location.search).get('tab');
  return TAB_ORDER.includes(requested as Tab) ? requested as Tab : null;
}

function PageFallback() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', flex:1, padding:'80px 24px' }}>
      <div className="spinner" style={{ width:22, height:22 }} />
    </div>
  );
}

function AuthPrompt({ onSignIn, tab }: { onSignIn: () => void; tab: string }) {
  const label = tab === 'profile' ? 'your private practice space' : 'your session history';
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      flex:1, padding:'48px 24px', textAlign:'center', gap:16 }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(112,72,232,0.1)', border: '1px solid rgba(112,72,232,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--violet)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      </div>
      <h2 className="type-h2" style={{ margin:0 }}>
        Sign in to view {label}
      </h2>
      <p className="type-caption" style={{ margin:0, maxWidth:280 }}>
        Create a free account or sign in to keep journals, sessions, and personal guidance safely together.
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
  const contentRef = React.useRef<HTMLDivElement>(null);
  const requestedTab = React.useMemo(readRequestedTab, []);
  const [tab, setTab] = useState<Tab>(requestedTab || 'journey');
  const [prevTab, setPrevTab] = useState<Tab>('journey');
  const [seenLanding, setSeenLanding] = useState(Boolean(requestedTab));
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

  React.useEffect(() => {
    if (!seenLanding) return;
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      contentRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [tab, seenLanding]);

  const handleTabChange = (next: Tab) => {
    if (next === tab) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      contentRef.current?.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      return;
    }
    setPrevTab(tab);
    setTab(next);
  };
  const handleBack = () => { setTab(prevTab === tab ? 'journey' : prevTab); setPrevTab('journey'); };
  const openAuth = () => setShowAuth(true);
  const navDir = TAB_ORDER.indexOf(tab) >= TAB_ORDER.indexOf(prevTab) ? 'fwd' : 'back';

  if (loading) {
    return (
      <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', flexDirection:'column', gap:16 }}>
        <div className="type-h1" style={{ color:'var(--blue)', letterSpacing:'0.14em' }}>
          ANAHATA
        </div>
        <div className="spinner" style={{ width:24, height:24 }} />
      </div>
    );
  }

  if (!seenLanding) return <LandingPage onEnter={() => setSeenLanding(true)} />;
  if (showAuth && !isAuthenticated) {
    return (
      <Suspense fallback={<PageFallback />}>
        <AuthPage onBack={() => setShowAuth(false)} />
      </Suspense>
    );
  }
  if (isAuthenticated && !onboarded) {
    return (
      <Suspense fallback={<PageFallback />}>
        <OnboardingPage onComplete={() => setOnboarded(true)} />
      </Suspense>
    );
  }

  const PROTECTED: Tab[] = ['profile'];
  const needsAuth = PROTECTED.includes(tab) && !isAuthenticated;

  const PAGES: Record<Tab, React.ComponentType<PageProps>> = {
    journey: JourneyPage as React.ComponentType<PageProps>,
    library: LibraryPage as React.ComponentType<PageProps>,
    studio: StudioPage as React.ComponentType<PageProps>,
    journal: JournalPage as React.ComponentType<PageProps>,
    profile: ProfilePage as React.ComponentType<PageProps>,
  };
  const Page = PAGES[tab];
  const pageProps: PageProps = tab === 'library'
    ? { onTabChange: handleTabChange }
    : tab === 'journal'
      ? { onRequireAuth: openAuth, onTabChange: handleTabChange }
      : {};

  return (
    <>
      <div className="page">
        <TopBar tab={tab} onSignIn={openAuth} onBack={tab !== 'journey' ? handleBack : undefined} />
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: navDir === 'fwd' ? 30 : -30, rotateX: navDir === 'fwd' ? 15 : -15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
              exit={{ opacity: 0, y: navDir === 'fwd' ? -30 : 30, rotateX: navDir === 'fwd' ? -15 : 15, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{ flex:1, display:'flex', flexDirection:'column', perspective: 1200 }}
              ref={contentRef}
            >
              <Suspense fallback={<PageFallback />}>
                {needsAuth
                  ? <AuthPrompt onSignIn={openAuth} tab={tab} />
                  : <Page {...pageProps} />
                }
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
        <BottomNav active={tab} onChange={handleTabChange} />
      </div>

      <GlobalTrackPlayer />
      {tab === 'journey' && <MobileInstallPrompt />}
      <AIFloatButton onClick={() => setShowAI(true)} />

      {showAI && (
        <Suspense fallback={null}>
          <AIMixDialog
            onClose={() => setShowAI(false)}
            onApplyMix={(mix) => { engine.applyMix(mix as Record<string, unknown>); setShowAI(false); }}
          />
        </Suspense>
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
            <TrackPlayerProvider>
              <Inner />
            </TrackPlayerProvider>
          </SoundEngineProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
