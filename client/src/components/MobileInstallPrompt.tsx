import React from 'react';
import { useInstallApp } from '../hooks/useInstallApp';

const DISMISS_KEY = 'anahata_mobile_install_dismissed';

export default function MobileInstallPrompt() {
  const installApp = useInstallApp();
  const [ready, setReady] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(() => localStorage.getItem(DISMISS_KEY) === '1');
  const needsSafari = installApp.isIOS && !installApp.isSafari;

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

  const title = installApp.canInstall
    ? 'Install Anahata'
    : needsSafari
      ? 'Open in Safari'
      : installApp.isIOS
        ? 'Add Anahata to Home Screen'
        : 'Keep Anahata close';
  const copy = installApp.canInstall
    ? 'Create a calm full-screen app space on this phone.'
    : needsSafari
      ? 'Copy this link, open Safari, then add it to your Home Screen.'
      : installApp.isIOS
        ? 'Tap Share, then Add to Home Screen.'
        : 'Use your phone browser to add it to your Home Screen.';
  const actionLabel = installApp.canInstall
    ? 'Install'
    : installApp.canShare
      ? installApp.isIOS && installApp.isSafari ? 'Share' : 'Send'
      : installApp.copied ? 'Copied' : 'Copy';
  const steps = installApp.isIOS ? ['Safari', 'Share', 'Add'] : installApp.canInstall ? ['Install', 'Open', 'Practice'] : ['Copy', 'Open', 'Add'];

  return (
    <section className="mobile-install-card" aria-label="Install Anahata">
      <div className="mobile-install-orb" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="7" y="2.5" width="10" height="19" rx="3" />
          <path d="M10 18.5h4" />
        </svg>
      </div>
      <div className="mobile-install-copy">
        <strong>{title}</strong>
        <span>{copy}</span>
        <div className="mobile-install-steps" aria-label="Install steps">
          {steps.map(step => <span key={step}>{step}</span>)}
        </div>
      </div>
      <button className="mobile-install-action" onClick={install}>
        {actionLabel}
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
