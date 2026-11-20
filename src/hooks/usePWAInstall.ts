import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export type InstallPlatform = 'android' | 'ios' | 'desktop';

declare global {
  interface Window {
    __krishiDeferredInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

const BANNER_DISMISSED_KEY = 'krishisetu_install_banner_dismissed_v1';

interface SharedPWAState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  platform: InstallPlatform;
  isInIframe: boolean;
  installIntent: boolean;
  bannerDismissed: boolean;
  standaloneInstallUrl: string;
}

function detectPlatform(): InstallPlatform {
  if (typeof window === 'undefined') return 'desktop';
  const ua = window.navigator.userAgent.toLowerCase();
  const isIPadOS =
    window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1;
  if (/iphone|ipad|ipod/.test(ua) || isIPadOS) {
    return 'ios';
  }
  if (/android/.test(ua)) {
    return 'android';
  }
  return 'desktop';
}

function detectIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function buildStandaloneInstallUrl(): string {
  if (typeof window === 'undefined') return '/';
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('install', '1');
    return url.toString();
  } catch {
    return '/?install=1';
  }
}

function readInitialInstallIntent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('install') === '1') {
      url.searchParams.delete('install');
      const cleaned = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState({}, '', cleaned || '/');
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

function readBannerDismissed(hasInstallIntent: boolean): boolean {
  if (hasInstallIntent || typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(BANNER_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

let initialized = false;
const listeners = new Set<() => void>();

let sharedState: SharedPWAState = {
  deferredPrompt: null,
  isInstalled: false,
  platform: 'desktop',
  isInIframe: false,
  installIntent: false,
  bannerDismissed: false,
  standaloneInstallUrl: '/?install=1',
};

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function updateSharedState(patch: Partial<SharedPWAState>) {
  sharedState = { ...sharedState, ...patch };
  notifyListeners();
}

function initSharedStore() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const installIntent = readInitialInstallIntent();
  sharedState = {
    deferredPrompt: window.__krishiDeferredInstallPrompt ?? null,
    isInstalled: detectStandalone(),
    platform: detectPlatform(),
    isInIframe: detectIframe(),
    installIntent,
    bannerDismissed: readBannerDismissed(installIntent),
    standaloneInstallUrl: buildStandaloneInstallUrl(),
  };

  const syncCapturedPrompt = () => {
    if (window.__krishiDeferredInstallPrompt) {
      updateSharedState({ deferredPrompt: window.__krishiDeferredInstallPrompt });
    }
  };

  const handleBeforeInstallPrompt = (event: Event) => {
    event.preventDefault();
    const promptEvent = event as BeforeInstallPromptEvent;
    window.__krishiDeferredInstallPrompt = promptEvent;
    updateSharedState({ deferredPrompt: promptEvent });
  };

  const handleAppInstalled = () => {
    window.__krishiDeferredInstallPrompt = null;
    updateSharedState({
      isInstalled: true,
      deferredPrompt: null,
      installIntent: false,
    });
  };

  const mediaQuery = window.matchMedia('(display-mode: standalone)');
  const handleDisplayModeChange = () => {
    updateSharedState({ isInstalled: detectStandalone() });
  };

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('krishi:install-prompt-ready', syncCapturedPrompt);
  window.addEventListener('appinstalled', handleAppInstalled);
  window.addEventListener('krishi:app-installed', handleAppInstalled);
  mediaQuery.addEventListener?.('change', handleDisplayModeChange);
}

export async function triggerPWAInstall(): Promise<boolean> {
  initSharedStore();
  const promptEvent =
    sharedState.deferredPrompt || window.__krishiDeferredInstallPrompt || null;
  if (!promptEvent) return false;

  try {
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    window.__krishiDeferredInstallPrompt = null;
    if (outcome === 'accepted') {
      updateSharedState({
        isInstalled: true,
        deferredPrompt: null,
        installIntent: false,
      });
      return true;
    }
    updateSharedState({ deferredPrompt: null });
    return false;
  } catch {
    return false;
  }
}

export function dismissPWABanner() {
  try {
    window.sessionStorage.setItem(BANNER_DISMISSED_KEY, '1');
  } catch {
    // Ignore storage errors in restricted browsing modes
  }
  updateSharedState({ bannerDismissed: true, installIntent: false });
}

export function usePWAInstall() {
  initSharedStore();
  const [state, setState] = useState<SharedPWAState>(() => sharedState);

  useEffect(() => {
    const onChange = () => setState(sharedState);
    listeners.add(onChange);
    // Sync immediately in case an event fired between render and effect
    onChange();
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  return {
    isInstallable: Boolean(state.deferredPrompt),
    isInstalled: state.isInstalled,
    isIOS: state.platform === 'ios',
    platform: state.platform,
    isInIframe: state.isInIframe,
    installIntent: state.installIntent,
    bannerDismissed: state.bannerDismissed,
    standaloneInstallUrl: state.standaloneInstallUrl,
    install: triggerPWAInstall,
    dismissBanner: dismissPWABanner,
  };
}


