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

function Inner() {
  const { isAuthenticated, loading } = useAuth();
  const [tab, setTab]       = useState('dashboard');
  const [onboarded, setOnboarded] = useState(!!localStorage.getItem('anahata_onboarded'));

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-0)' }}>
        <div className="spinner" style={{ width:28, height:28 }} />
      </div>
    );
  }

  if (!isAuthenticated) return <AuthPage />;
  if (!onboarded)       return <OnboardingPage onComplete={() => setOnboarded(true)} />;

  const PAGES = { dashboard: DashboardPage, library: LibraryPage, sessions: SessionsPage, profile: ProfilePage };
  const Page = PAGES[tab] || DashboardPage;

  return (
    <div className="page">
      <TopBar tab={tab} />
      <ErrorBoundary>
        <Page />
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
