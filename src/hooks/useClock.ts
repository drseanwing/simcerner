/**
 * @file useClock.ts
 * @description React hook for the simulation clock.
 *
 * Wraps the clock Zustand store and manages an auto-tick interval
 * that advances the simulation time according to the playback speed.
 * Returns formatted time strings and playback controls for the UI.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useClockStore } from '../stores/clockStore';
import type { PlaybackSpeed } from '../stores/clockStore';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Base interval in milliseconds between ticks.
 * One real-time second advances 1 simulation second at 1× speed.
 */
const TICK_INTERVAL_MS = 1_000;

// ---------------------------------------------------------------------------
// Hook Return Type
// ---------------------------------------------------------------------------

/** Shape returned by the {@link useClock} hook. */
export interface UseClockResult {
  /** Current simulation Date object. */
  currentTime: Date;

  /** Formatted date string (e.g. "17-Feb-2026"). */
  formattedDate: string;

  /** Formatted time string (e.g. "08:45:12"). */
  formattedTime: string;

  /** Combined date-time string. */
  formattedDateTime: string;

  /** Whether the clock is actively ticking. */
  isRunning: boolean;

  /** Whether the clock is paused. */
  isPaused: boolean;

  /** Current playback speed multiplier. */
  playbackSpeed: PlaybackSpeed;

  /** Start the simulation clock. */
  start: () => void;

  /** Stop the simulation clock. */
  stop: () => void;

  /** Pause the clock. */
  pause: () => void;

  /** Resume the clock. */
  resume: () => void;

  /** Change playback speed. */
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;

  /** Jump the clock by N minutes. */
  advanceMinutes: (minutes: number) => void;

  /** Jump the clock by N hours. */
  advanceHours: (hours: number) => void;

  /** Set the clock to a specific Date. */
  setTime: (time: Date) => void;
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/** Pad a number to two digits. */
function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Three-letter month abbreviations. */
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/** Format a Date as "DD-Mon-YYYY". */
function formatDate(d: Date): string {
  return `${pad2(d.getDate())}-${MONTHS[d.getMonth()]}-${d.getFullYear()}`;
}

/** Format a Date as "HH:MM:SS". */
function formatTime(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * React hook for the simulation clock.
 *
 * Automatically starts a `setInterval` tick when the clock is running
 * and not paused. Each tick advances the simulation time by the
 * playback speed multiplier.
 *
 * @returns Formatted time, controls, and state.
 *
 * @example
 * ```tsx
 * const { formattedTime, isRunning, start, setPlaybackSpeed } = useClock();
 * ```
 */
export function useClock(): UseClockResult {
  const currentTime = useClockStore((s) => s.currentTime);
  const isRunning = useClockStore((s) => s.isRunning);
  const isPaused = useClockStore((s) => s.isPaused);
  const playbackSpeed = useClockStore((s) => s.playbackSpeed);
  const start = useClockStore((s) => s.start);
  const stop = useClockStore((s) => s.stop);
  const pause = useClockStore((s) => s.pause);
  const resume = useClockStore((s) => s.resume);
  const setPlaybackSpeed = useClockStore((s) => s.setPlaybackSpeed);
  const advanceMinutes = useClockStore((s) => s.advanceMinutes);
  const advanceHours = useClockStore((s) => s.advanceHours);
  const setTime = useClockStore((s) => s.setTime);

  // Use refs for values read inside the interval to avoid stale closures
  const speedRef = useRef(playbackSpeed);
  speedRef.current = playbackSpeed;

  // Auto-tick effect
  useEffect(() => {
    if (!isRunning || isPaused) return;

    const intervalId = setInterval(() => {
      // Advance simulation by (playbackSpeed) seconds per real second
      const store = useClockStore.getState();
      const next = new Date(
        store.currentTime.getTime() + speedRef.current * 1_000,
      );
      store.setTime(next);
    }, TICK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isRunning, isPaused]);

  // Memoised formatted strings
  const formattedDate = useMemo(() => formatDate(currentTime), [currentTime]);
  const formattedTime = useMemo(() => formatTime(currentTime), [currentTime]);
  const formattedDateTime = useMemo(
    () => `${formattedDate} ${formattedTime}`,
    [formattedDate, formattedTime],
  );

  return useMemo(
    () => ({
      currentTime,
      formattedDate,
      formattedTime,
      formattedDateTime,
      isRunning,
      isPaused,
      playbackSpeed,
      start,
      stop,
      pause,
      resume,
      setPlaybackSpeed,
      advanceMinutes,
      advanceHours,
      setTime,
    }),
    [
      currentTime,
      formattedDate,
      formattedTime,
      formattedDateTime,
      isRunning,
      isPaused,
      playbackSpeed,
      start,
      stop,
      pause,
      resume,
      setPlaybackSpeed,
      advanceMinutes,
      advanceHours,
      setTime,
    ],
  );
}
