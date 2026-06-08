import React from 'react';
import { useInstallApp } from '../hooks/useInstallApp';

export default function InstallAppControl() {
  const installApp = useInstallApp();

  const title = installApp.isStandalone ? 'Anahata is on this phone' : 'Install Anahata';
  const body = installApp.isStandalone
    ? 'Open it from your Home Screen whenever you want to practice.'
    : installApp.isIOS
      ? 'On iPhone, open Anahata in Safari, tap Share, then Add to Home Screen.'
      : installApp.canInstall
        ? 'Add Anahata to your Home Screen for a calmer app-like space.'
        : 'Open this link on your phone and add it from your browser menu.';

  async function handlePrimary() {
    if (installApp.canInstall) {
      await installApp.install();
      return;
    }
    await installApp.shareOrCopyLink();
  }

  return (
    <section className="install-control" aria-label="Install Anahata on this phone">
      <div className="install-control-orb" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="7" y="2.5" width="10" height="19" rx="3" />
          <path d="M10 18.5h4" />
        </svg>
      </div>
      <div className="install-control-copy">
        <span className="section-title" style={{ marginBottom: 5, color: '#3B5BDB' }}>Phone app</span>
        <h3>{title}</h3>
        <p>{body}</p>
        {installApp.isIOS && !installApp.isStandalone && (
          <div className="install-steps" aria-label="iPhone install steps">
            <span>Safari</span>
            <span>Share</span>
            <span>Add to Home Screen</span>
          </div>
        )}
      </div>
      {!installApp.isStandalone && (
        <button className="install-control-action" onClick={handlePrimary}>
          {installApp.canInstall ? 'Install' : installApp.canShare ? 'Share' : installApp.copied ? 'Copied' : 'Copy link'}
        </button>
      )}
    </section>
  );
}
