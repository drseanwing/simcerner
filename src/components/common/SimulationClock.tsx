/**
 * @file SimulationClock.tsx
 * @description Visual simulation clock control panel for the status bar.
 *
 * Displays the current simulation time prominently with play/pause,
 * speed controls, and time travel buttons. Compact design for inline
 * use in the StatusBar footer.
 */

import { useCallback } from 'react';
import { useClockStore } from '../../stores/clockStore';
import type { PlaybackSpeed } from '../../stores/clockStore';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SPEED_OPTIONS: PlaybackSpeed[] = [1, 2, 5, 10];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Pad a number to two digits. */
function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

function formatTime(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatDate(d: Date): string {
  return `${pad2(d.getDate())}-${MONTHS[d.getMonth()]}-${d.getFullYear()}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * SimulationClock renders an inline clock control panel with:
 * - Large HH:MM time display with date below
 * - Play/Pause toggle
 * - Speed multiplier button group (1x–10x)
 * - Time travel buttons (-1hr, -15min, +15min, +1hr)
 * - Reset to current time
 */
export default function SimulationClock() {
  const currentTime = useClockStore((s) => s.currentTime);
  const isRunning = useClockStore((s) => s.isRunning);
  const isPaused = useClockStore((s) => s.isPaused);
  const playbackSpeed = useClockStore((s) => s.playbackSpeed);
  const start = useClockStore((s) => s.start);
  const pause = useClockStore((s) => s.pause);
  const resume = useClockStore((s) => s.resume);
  const setPlaybackSpeed = useClockStore((s) => s.setPlaybackSpeed);
  const advanceMinutes = useClockStore((s) => s.advanceMinutes);
  const advanceHours = useClockStore((s) => s.advanceHours);
  const setTime = useClockStore((s) => s.setTime);

  const ticking = isRunning && !isPaused;

  const handlePlayPause = useCallback(() => {
    if (!isRunning) {
      start();
    } else if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isRunning, isPaused, start, resume, pause]);

  const handleReset = useCallback(() => {
    setTime(new Date());
  }, [setTime]);

  return (
    <div className="sim-clock">
      {/* Time display */}
      <div className="sim-clock__display">
        <span className="sim-clock__time">{formatTime(currentTime)}</span>
        <span className="sim-clock__date">{formatDate(currentTime)}</span>
      </div>

      {/* Play/Pause */}
      <button
        className={`sim-clock__btn sim-clock__btn--play${ticking ? ' sim-clock__btn--active' : ''}`}
        onClick={handlePlayPause}
        title={ticking ? 'Pause' : 'Play'}
        type="button"
      >
        {ticking ? '❚❚' : '▶'}
      </button>

      {/* Speed controls */}
      <div className="sim-clock__speed-group">
        {SPEED_OPTIONS.map((speed) => (
          <button
            key={speed}
            className={`sim-clock__btn sim-clock__btn--speed${playbackSpeed === speed ? ' sim-clock__btn--active' : ''}`}
            onClick={() => setPlaybackSpeed(speed)}
            title={`${speed}× speed`}
            type="button"
          >
            {speed}×
          </button>
        ))}
      </div>

      {/* Time travel */}
      <div className="sim-clock__travel-group">
        <button
          className="sim-clock__btn sim-clock__btn--travel"
          onClick={() => advanceHours(-1)}
          title="Go back 1 hour"
          type="button"
        >
          -1h
        </button>
        <button
          className="sim-clock__btn sim-clock__btn--travel"
          onClick={() => advanceMinutes(-15)}
          title="Go back 15 minutes"
          type="button"
        >
          -15m
        </button>
        <button
          className="sim-clock__btn sim-clock__btn--travel"
          onClick={() => advanceMinutes(15)}
          title="Go forward 15 minutes"
          type="button"
        >
          +15m
        </button>
        <button
          className="sim-clock__btn sim-clock__btn--travel"
          onClick={() => advanceHours(1)}
          title="Go forward 1 hour"
          type="button"
        >
          +1h
        </button>
      </div>

      {/* Reset */}
      <button
        className="sim-clock__btn sim-clock__btn--reset"
        onClick={handleReset}
        title="Reset to current time"
        type="button"
      >
        ↺
      </button>
    </div>
  );
}
