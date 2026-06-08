import React from 'react';
import { useInstallApp } from '../hooks/useInstallApp';

const DISMISS_KEY = 'anahata_mobile_install_dismissed';

export default function MobileInstallPrompt() {
  const installApp = useInstallApp();
  const [ready, setReady] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(() => localStorage.getItem(DISMISS_KEY) === '1');

  React.useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  const dismiss = React.useCallback(() => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }, []);

  const install = React.useCallback(async () => {
    if (!installApp.canInstall) {
      await installApp.shareOrCopyLink();
      return;
    }

    const accepted = await installApp.install();
    if (accepted) dismiss();
  }, [dismiss, installApp]);

  if (!ready || dismissed || installApp.isStandalone || !installApp.isMobile) return null;

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
          {installApp.isIOS
            ? 'Open in Safari, tap Share, then Add to Home Screen.'
            : installApp.canInstall
              ? 'Install from this calm space.'
              : 'Add it from your browser menu.'}
        </span>
      </div>
      <button className="mobile-install-action" onClick={install}>
        {installApp.canInstall ? 'Install' : installApp.canShare ? 'Share' : installApp.copied ? 'Copied' : 'Copy link'}
      </button>
      <button className="mobile-install-close" onClick={dismiss} aria-label="Dismiss install prompt">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </section>
  );
}
