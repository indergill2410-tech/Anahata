import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type VerificationNoticeProps = {
  compact?: boolean;
  title?: string;
  body?: string;
};

export default function VerificationNotice({
  compact = false,
  title = 'Verify your email',
  body = 'Private saves unlock after email verification. You can keep exploring while Anahata waits for that signal.',
}: VerificationNoticeProps) {
  const { user, requestVerification, refreshUser } = useAuth();
  const { success, error, info } = useToast();
  const [busy, setBusy] = useState<'send' | 'refresh' | null>(null);

  if (!user || user.verified) return null;

  async function handleSend() {
    setBusy('send');
    try {
      await requestVerification();
      success('Verification email sent.');
    } catch (err) {
      error((err as Error).message || 'Verification email needs another try.');
    } finally {
      setBusy(null);
    }
  }

  async function handleRefresh() {
    setBusy('refresh');
    try {
      const next = await refreshUser();
      if (next?.verified) success('Email verified. Private saves are open.');
      else info('Still waiting for verification.');
    } catch (err) {
      error((err as Error).message || 'Verification check needs another try.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className={`verification-notice ${compact ? 'compact' : ''}`} data-effect="verification">
      <span className="verification-orb" aria-hidden="true" />
      <div className="verification-copy">
        <strong>{title}</strong>
        <span>{body}</span>
      </div>
      <div className="verification-actions">
        <button type="button" onClick={handleSend} disabled={busy !== null}>
          {busy === 'send' ? 'Sending' : 'Send link'}
        </button>
        <button type="button" onClick={handleRefresh} disabled={busy !== null}>
          {busy === 'refresh' ? 'Checking' : 'I verified'}
        </button>
      </div>
    </section>
  );
}
