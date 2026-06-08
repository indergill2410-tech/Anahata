import React from 'react';

type InstallChoice = { outcome: 'accepted' | 'dismissed'; platform: string };

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<InstallChoice>;
  prompt: () => Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let listening = false;
const subscribers = new Set<() => void>();

function notify() {
  subscribers.forEach(listener => listener());
}

function ensureInstallListener() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

export function isStandaloneApp() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    || window.location.protocol === 'capacitor:';
}

export function getMobilePlatform() {
  if (typeof window === 'undefined') return 'desktop';
  const ua = window.navigator.userAgent;
  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (window.matchMedia('(max-width: 760px)').matches) return 'mobile';
  return 'desktop';
}

export function isMobileInstallTarget() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 760px)').matches
    || /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);
}

export function useInstallApp() {
  const [prompt, setPrompt] = React.useState<BeforeInstallPromptEvent | null>(deferredPrompt);
  const [standalone, setStandalone] = React.useState(isStandaloneApp);
  const [copied, setCopied] = React.useState(false);
  const platform = React.useMemo(() => getMobilePlatform(), []);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  React.useEffect(() => {
    ensureInstallListener();
    const update = () => {
      setPrompt(deferredPrompt);
      setStandalone(isStandaloneApp());
    };
    subscribers.add(update);
    const media = window.matchMedia('(display-mode: standalone)');
    media.addEventListener?.('change', update);
    return () => {
      subscribers.delete(update);
      media.removeEventListener?.('change', update);
    };
  }, []);

  const install = React.useCallback(async () => {
    if (!prompt) return false;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      deferredPrompt = null;
      setPrompt(null);
      notify();
      return choice.outcome === 'accepted';
    } catch {
      deferredPrompt = null;
      setPrompt(null);
      notify();
      return false;
    }
  }, [prompt]);

  const copyLink = React.useCallback(async () => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(window.location.origin);
      } catch {
        window.prompt('Copy this Anahata link', window.location.origin);
      }
    } else {
      window.prompt('Copy this Anahata link', window.location.origin);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }, []);

  const shareOrCopyLink = React.useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Anahata',
          text: 'Open Anahata on this phone.',
          url: window.location.origin,
        });
        return true;
      } catch {
        return false;
      }
    }
    await copyLink();
    return true;
  }, [copyLink]);

  return {
    canShare,
    canInstall: Boolean(prompt),
    copied,
    copyLink,
    install,
    shareOrCopyLink,
    isAndroid: platform === 'android',
    isIOS: platform === 'ios',
    isMobile: isMobileInstallTarget(),
    isStandalone: standalone,
    platform,
  };
}
