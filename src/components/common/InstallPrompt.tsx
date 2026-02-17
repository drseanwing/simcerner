/**
 * @file InstallPrompt.tsx
 * @description PWA install prompt banner.
 *
 * Captures the `beforeinstallprompt` event and renders a dismissable
 * banner inviting the user to install the app. Dismissal state is
 * persisted in localStorage so the banner does not reappear.
 */

import { useEffect, useState, useCallback, useRef } from 'react';

/** localStorage key for tracking dismissal. */
const DISMISS_KEY = 'pwa-install-dismissed';

/**
 * The `BeforeInstallPromptEvent` is not yet part of the standard
 * TypeScript DOM types, so we define a minimal interface here.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === 'true') return;

    function handlePrompt(e: Event) {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setShow(true);
    }

    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const handleInstall = useCallback(async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;

    await prompt.prompt();
    const { outcome } = await prompt.userChoice;

    if (outcome === 'accepted') {
      setShow(false);
    }
    deferredPromptRef.current = null;
  }, []);

  const handleDismiss = useCallback(() => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, 'true');
    deferredPromptRef.current = null;
  }, []);

  if (!show) return null;

  return (
    <div
      role="banner"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        padding: '10px 16px',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        backgroundColor: '#e8f0fe',
        color: '#004578',
        borderTop: '1px solid #b3d4fc',
        boxShadow: '0 -2px 6px rgba(0,0,0,0.08)',
      }}
    >
      <span style={{ fontSize: '16px' }}>📥</span>
      <span style={{ fontWeight: 500 }}>
        Install PowerChart Sim for offline access
      </span>
      <button
        type="button"
        onClick={handleInstall}
        style={{
          padding: '4px 14px',
          fontSize: '12px',
          fontWeight: 600,
          color: '#fff',
          backgroundColor: '#004578',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer',
        }}
      >
        Install
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss install prompt"
        style={{
          padding: '4px 8px',
          fontSize: '16px',
          color: '#666',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  );
}
