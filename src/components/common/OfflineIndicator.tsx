/**
 * @file OfflineIndicator.tsx
 * @description Displays a banner when the browser is offline.
 *
 * Listens to the `online` and `offline` window events via `navigator.onLine`
 * and renders a subtle warning bar. When connectivity is restored, a brief
 * "Back online" confirmation is shown before the banner disappears.
 */

import { useEffect, useState, useRef } from 'react';

/** How long (ms) the "Back online" message stays visible after reconnecting. */
const RECONNECT_DISPLAY_MS = 3000;

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleOffline() {
      setIsOffline(true);
      setShowReconnected(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }

    function handleOnline() {
      setIsOffline(false);
      setShowReconnected(true);
      timerRef.current = setTimeout(() => {
        setShowReconnected(false);
      }, RECONNECT_DISPLAY_MS);
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!isOffline && !showReconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        padding: '6px 16px',
        fontSize: '13px',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        backgroundColor: isOffline ? '#fff3cd' : '#d4edda',
        color: isOffline ? '#856404' : '#155724',
        borderBottom: `1px solid ${isOffline ? '#ffc107' : '#c3e6cb'}`,
      }}
    >
      <span style={{ fontSize: '16px' }}>{isOffline ? '⚠' : '✓'}</span>
      <span>
        {isOffline
          ? 'You are offline — data may not be current'
          : 'Back online'}
      </span>
    </div>
  );
}
