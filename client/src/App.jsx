import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import SessionsPage from './pages/SessionsPage';
import ProfilePage from './pages/ProfilePage';
import LibraryPage from './pages/LibraryPage';
import BottomNav from './components/BottomNav';
import TopBar from './components/TopBar';

function AuthPrompt({ onSignIn, tab }) {
  const label = tab === 'profile' ? 'your profile' : 'your session history';
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      flex:1, padding:'48px 24px', textAlign:'center', gap:16 }}>
      <div style={{ fontSize:40 }}>🔒</div>
      <h2 style={{ fontSize:18, fontWeight:600, color:'var(--t1)', margin:0 }}>Sign in to view {label}</h2>
      <p style={{ fontSize:13, color:'var(--t3)', margin:0, maxWidth:260 }}>
        Create a free account or sign in to unlock your personal data and history.
      </p>
      <button onClick={onSignIn} className="btn-primary" style={{ marginTop:8, padding:'12px 32px', fontSize:14 }}>
        Sign In / Register
      </button>
    </div>
  );
}

function Inner() {
  const { isAuthenticated, loading } = useAuth();
  const [tab, setTab]       = useState('dashboard');
  const [onboarded, setOnboarded] = useState(!!localStorage.getItem('anahata_onboarded'));

  const [showAuth, setShowAuth] = useState(false);

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-0)' }}>
        <div className="spinner" style={{ width:28, height:28 }} />
      </div>
    );
  }

  if (showAuth && !isAuthenticated) return <AuthPage onBack={() => setShowAuth(false)} />;
  if (isAuthenticated && !onboarded) return <OnboardingPage onComplete={() => setOnboarded(true)} />;

  const PROTECTED = ['sessions', 'profile'];
  const needsAuth = PROTECTED.includes(tab) && !isAuthenticated;

  const PAGES = { dashboard: DashboardPage, library: LibraryPage, sessions: SessionsPage, profile: ProfilePage };
  const Page = PAGES[tab] || DashboardPage;

  return (
    <div className="page">
      <TopBar tab={tab} onSignIn={() => setShowAuth(true)} />
      <ErrorBoundary>
        {needsAuth
          ? <AuthPrompt onSignIn={() => setShowAuth(true)} tab={tab} />
          : <Page />
        }
      </ErrorBoundary>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <Inner />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
