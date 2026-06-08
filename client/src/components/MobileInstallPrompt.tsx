import React from 'react';

type InstallChoice = { outcome: 'accepted' | 'dismissed'; platform: string };

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<InstallChoice>;
  prompt: () => Promise<void>;
}

const DISMISS_KEY = 'anahata_mobile_install_dismissed';

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    || window.location.protocol === 'capacitor:';
}

function isMobileDevice() {
  return window.matchMedia('(max-width: 760px)').matches
    || /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);
}

function getPlatform() {
  const ua = window.navigator.userAgent;
  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  return 'mobile';
}

export default function MobileInstallPrompt() {
  const [ready, setReady] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(() => localStorage.getItem(DISMISS_KEY) === '1');
  const [installPrompt, setInstallPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const platform = React.useMemo(() => getPlatform(), []);

  React.useEffect(() => {
    if (!isMobileDevice() || isStandalone()) return;
    const timer = window.setTimeout(() => setReady(true), 1500);
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setReady(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    };
  }, []);

  const dismiss = React.useCallback(() => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }, []);

  const install = React.useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') dismiss();
    setInstallPrompt(null);
  }, [dismiss, installPrompt]);

  if (!ready || dismissed || isStandalone()) return null;

  const isAndroid = platform === 'android';
  const isIOS = platform === 'ios';

  return (
    <section className="mobile-install-card" aria-label="Install Anahata">
      <div className="mobile-install-orb" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="7" y="2.5" width="10" height="19" rx="3" />
          <path d="M10 18.5h4" />
        </svg>
      </div>
      <div className="mobile-install-copy">
        <strong>Keep Anahata on this phone</strong>
        <span>
          {isIOS
            ? 'Tap Share, then Add to Home Screen.'
            : isAndroid
              ? 'Install the app from this secure page.'
              : 'Add it to your Home Screen.'}
        </span>
      </div>
      {installPrompt && (
        <button className="mobile-install-action" onClick={install}>
          Install
        </button>
      )}
      <button className="mobile-install-close" onClick={dismiss} aria-label="Dismiss install prompt">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </section>
  );
}
