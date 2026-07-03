import React from 'react';
import { useInstallApp } from '../hooks/useInstallApp';

function InstallStep({ index, label }: { index: number; label: string }) {
  return (
    <span className="install-step">
      <span>{index}</span>
      {label}
    </span>
  );
}

export default function InstallAppControl() {
  const installApp = useInstallApp();
  const needsSafari = installApp.isIOS && !installApp.isSafari && !installApp.isStandalone;

  const title = installApp.isStandalone
    ? 'Anahata lives on this phone'
    : needsSafari
      ? 'Open Anahata in Safari'
      : installApp.isIOS
        ? 'Add Anahata to Home Screen'
        : installApp.canInstall
          ? 'Install Anahata on this phone'
          : installApp.isAndroid
            ? 'Keep Anahata one tap away'
            : 'Send Anahata to your phone';
  const body = installApp.isStandalone
    ? 'Open from your Home Screen whenever you want a private practice space.'
    : needsSafari
      ? 'Copy or share this link, open it in Safari, then add it to your Home Screen.'
      : installApp.isIOS
        ? 'Use the Share button in Safari, then choose Add to Home Screen. It will feel like a calm native app.'
        : installApp.canInstall
          ? 'Add Anahata to your Home Screen for a focused, full-screen practice space.'
          : installApp.isAndroid
            ? 'Open this page in Chrome and use the browser install option if the button is not shown yet.'
            : 'Copy the link or share it to your phone, then add it from the mobile browser.';
  const statusLabel = installApp.isStandalone
    ? 'Installed'
    : installApp.canInstall
      ? 'Ready'
      : installApp.isIOS
        ? installApp.isSafari ? 'Safari steps' : 'Safari needed'
        : installApp.isAndroid
          ? 'Open in Chrome'
          : 'Link ready';
  const primaryLabel = installApp.canInstall
    ? 'Install'
    : installApp.canShare
      ? installApp.isIOS && installApp.isSafari ? 'Open share sheet' : 'Share link'
      : installApp.copied ? 'Copied' : 'Copy link';

  async function handlePrimary() {
    if (installApp.canInstall) {
      await installApp.install();
      return;
    }
    await installApp.shareOrCopyLink();
  }

  async function handleCopy() {
    await installApp.copyLink();
  }

  const steps = installApp.isStandalone
    ? ['Home Screen', 'One tap', 'Ready']
    : installApp.isIOS
      ? ['Safari', 'Share', 'Add to Home Screen']
      : installApp.canInstall
        ? ['Install', 'Home Screen', 'Full screen']
        : ['Copy link', 'Open on phone', 'Add to Home'];

  return (
    <section className="install-control install-control-premium" aria-label="Install Anahata on this phone">
      <div className="install-control-head">
        <div className="install-control-orb" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="7" y="2.5" width="10" height="19" rx="3" />
            <path d="M10 18.5h4" />
          </svg>
        </div>
        <div className="install-control-copy">
          <span className="install-kicker">Phone app</span>
          <h3>{title}</h3>
          <p>{body}</p>
        </div>
        <span className="install-status">{statusLabel}</span>
      </div>

      <div className="install-steps" aria-label="Phone install steps">
        {steps.map((step, index) => <InstallStep key={step} index={index + 1} label={step} />)}
      </div>

      {!installApp.isStandalone && (
        <div className="install-actions">
          <button className="install-control-action" onClick={handlePrimary}>
            {primaryLabel}
          </button>
          <button className="install-copy-action" onClick={handleCopy}>
            {installApp.copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      )}

      {!installApp.isSecure && (
        <p className="install-note">
          Use the secure Anahata link on your phone before adding it to the Home Screen.
        </p>
      )}

      {needsSafari && (
        <p className="install-note">
          On iPhone, Home Screen apps are added from Safari. The link is ready when you are.
        </p>
      )}

      {installApp.isStandalone && (
        <div className="install-complete">
          <span aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          Installed and ready for your next practice.
        </div>
      )}
    </section>
  );
}
