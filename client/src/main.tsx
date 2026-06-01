import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

// Native setup — safe no-ops when running in a browser
(async () => {
  try { await StatusBar.setStyle({ style: Style.Dark }); } catch {}
  try { await StatusBar.setBackgroundColor({ color: '#0e0e1a' }); } catch {}
  try { await SplashScreen.hide(); } catch {}
})();

const root = document.getElementById('root') as HTMLElement;
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
