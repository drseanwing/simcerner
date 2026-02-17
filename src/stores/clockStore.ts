/**
 * @file clockStore.ts
 * @description Zustand store for the simulation clock in the SimCerner EMR.
 *
 * Manages a virtual clock that can be started, paused, and run at
 * configurable playback speeds (1×, 2×, 5×, 10×). The clock drives
 * time-dependent features such as medication due-times on the MAR,
 * vital sign observation windows, and NEWS2 escalation timers.
 */

import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported playback speed multipliers. */
export type PlaybackSpeed = 1 | 2 | 5 | 10;

/** Read-only state slice of the clock store. */
export interface ClockState {
  /** The current simulation date-time. */
  currentTime: Date;

  /** Whether the simulation clock is actively ticking. */
  isRunning: boolean;

  /** Current playback speed multiplier. */
  playbackSpeed: PlaybackSpeed;

  /** Whether the clock is paused (still "running" but frozen). */
  isPaused: boolean;
}

/** Mutation actions exposed by the clock store. */
export interface ClockActions {
  /**
   * Set the simulation time to an arbitrary point.
   * @param time - The new simulation Date.
   */
  setTime: (time: Date) => void;

  /** Start the simulation clock. Resets pause state. */
  start: () => void;

  /** Stop the simulation clock completely. */
  stop: () => void;

  /** Pause the clock without stopping it. */
  pause: () => void;

  /** Resume the clock from a paused state. */
  resume: () => void;

  /**
   * Change the playback speed multiplier.
   * @param speed - One of 1, 2, 5, or 10.
   */
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;

  /**
   * Advance the simulation clock by a given number of minutes.
   * @param minutes - Minutes to add (may be fractional).
   */
  advanceMinutes: (minutes: number) => void;

  /**
   * Advance the simulation clock by a given number of hours.
   * @param hours - Hours to add (may be fractional).
   */
  advanceHours: (hours: number) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

/** Combined clock store type. */
export type ClockStore = ClockState & ClockActions;

/**
 * Zustand store for the simulation clock.
 *
 * @example
 * ```tsx
 * const time = useClockStore(s => s.currentTime);
 * const start = useClockStore(s => s.start);
 * ```
 */
export const useClockStore = create<ClockStore>((set, get) => ({
  // -- initial state --------------------------------------------------------
  currentTime: new Date(),
  isRunning: false,
  playbackSpeed: 1 as PlaybackSpeed,
  isPaused: false,

  // -- actions --------------------------------------------------------------

  setTime: (time) => set({ currentTime: time }),

  start: () => set({ isRunning: true, isPaused: false }),

  stop: () => set({ isRunning: false, isPaused: false }),

  pause: () => set({ isPaused: true }),

  resume: () => set({ isPaused: false }),

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  advanceMinutes: (minutes) => {
    const { currentTime } = get();
    const next = new Date(currentTime.getTime() + minutes * 60_000);
    set({ currentTime: next });
  },

  advanceHours: (hours) => {
    const { currentTime } = get();
    const next = new Date(currentTime.getTime() + hours * 3_600_000);
    set({ currentTime: next });
  },
}));
