import React from 'react';

type InstallChoice = { outcome: 'accepted' | 'dismissed'; platform: string };
type MobilePlatform = 'android' | 'ios' | 'mobile' | 'desktop';
type InstallStatus = 'installed' | 'ready' | 'ios-safari' | 'ios-browser' | 'android-browser' | 'copy-link' | 'desktop';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<InstallChoice>;
  prompt: () => Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let listening = false;
const subscribers = new Set<() => void>();
const INSTALLED_KEY = 'anahata_installed_on_device';

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
    localStorage.setItem(INSTALLED_KEY, '1');
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
  if (/Macintosh/i.test(ua) && window.navigator.maxTouchPoints > 1) return 'ios';
  if (window.matchMedia('(max-width: 760px)').matches) return 'mobile';
  return 'desktop';
}

export function isMobileInstallTarget() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 760px)').matches
    || /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);
}

export function isSafariBrowser() {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const isApple = /iPhone|iPad|iPod|Macintosh/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome|Android/i.test(ua);
  return isApple && isSafari;
}

export function isInAppBrowser() {
  if (typeof window === 'undefined') return false;
  return /FBAN|FBAV|Instagram|Line\/|LinkedInApp|Twitter|TikTok|WhatsApp/i.test(window.navigator.userAgent);
}

function getInstallStatus(platform: MobilePlatform, prompt: BeforeInstallPromptEvent | null, standalone: boolean): InstallStatus {
  if (standalone) return 'installed';
  if (prompt) return 'ready';
  if (platform === 'ios') return isSafariBrowser() ? 'ios-safari' : 'ios-browser';
  if (platform === 'android') return 'android-browser';
  if (platform === 'mobile') return 'copy-link';
  return 'desktop';
}

export function useInstallApp() {
  const [prompt, setPrompt] = React.useState<BeforeInstallPromptEvent | null>(deferredPrompt);
  const [standalone, setStandalone] = React.useState(isStandaloneApp);
  const [copied, setCopied] = React.useState(false);
  const platform = React.useMemo<MobilePlatform>(() => getMobilePlatform(), []);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const installUrl = typeof window === 'undefined' ? '' : window.location.origin;
  const isSecure = typeof window === 'undefined' ? false : window.isSecureContext || window.location.hostname === 'localhost';

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
    const url = window.location.origin;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        window.prompt('Copy this Anahata link', url);
      }
    } else {
      window.prompt('Copy this Anahata link', url);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
    return true;
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
      } catch (err) {
        if ((err as DOMException)?.name === 'AbortError') return false;
      }
    }
    await copyLink();
    return true;
  }, [copyLink]);

  const status = getInstallStatus(platform, prompt, standalone);

  return {
    canShare,
    canInstall: Boolean(prompt),
    canNativeInstall: Boolean(prompt),
    copied,
    copyLink,
    install,
    installUrl,
    isInAppBrowser: isInAppBrowser(),
    isSafari: isSafariBrowser(),
    isSecure,
    shareOrCopyLink,
    status,
    isAndroid: platform === 'android',
    isIOS: platform === 'ios',
    isMobile: isMobileInstallTarget(),
    isStandalone: standalone,
    platform,
  };
}
