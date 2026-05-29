import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import SessionsPage from './pages/SessionsPage';
import ProfilePage from './pages/ProfilePage';
import BottomNav from './components/BottomNav';
import TopBar from './components/TopBar';

function Inner() {
  const { isAuthenticated, loading } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const hasOnboarded = localStorage.getItem('anahata_onboarded');
  const [onboarded, setOnboarded] = useState(!!hasOnboarded);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  if (!isAuthenticated) return <AuthPage />;
  if (!onboarded) return <OnboardingPage onComplete={() => setOnboarded(true)} />;

  const Page = { dashboard: DashboardPage, sessions: SessionsPage, profile: ProfilePage }[tab];

  return (
    <div className="page">
      <TopBar tab={tab} />
      <Page />
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Inner />
    </AuthProvider>
  );
}
