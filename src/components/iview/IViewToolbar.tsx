/**
 * @file IViewToolbar.tsx
 * @description Toolbar component for the iView flowsheet view.
 *
 * Provides:
 * - Sign button (finalise all unsigned documentation)
 * - Refresh button
 * - Time interval selector as a segmented button group (1hr, 2hr, 4hr, 8hr, 12hr)
 * - Show/hide empty rows checkbox
 * - Time range display and current-time indicator
 */

import { useMemo } from 'react';
import type { TimeInterval } from '../../types/iview';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Available time interval options with labels. */
const TIME_INTERVALS: { value: TimeInterval; label: string }[] = [
  { value: '1hr', label: '1hr' },
  { value: '2hr', label: '2hr' },
  { value: '4hr', label: '4hr' },
  { value: '8hr', label: '8hr' },
  { value: '12hr', label: '12hr' },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props accepted by the IViewToolbar component. */
export interface IViewToolbarProps {
  /** Currently selected time interval. */
  timeInterval: TimeInterval;

  /** Whether empty (undocumented) rows are shown. */
  showEmptyRows: boolean;

  /** Start of the visible time range. */
  timeRangeStart: Date;

  /** End of the visible time range. */
  timeRangeEnd: Date;

  /** Number of unsigned entries available to sign. */
  unsignedCount: number;

  /** Callback when the time interval is changed. */
  onTimeIntervalChange: (interval: TimeInterval) => void;

  /** Callback when the show-empty-rows toggle is changed. */
  onShowEmptyRowsChange: (show: boolean) => void;

  /** Callback when the Sign button is clicked. */
  onSign: () => void;

  /** Callback when the Refresh button is clicked. */
  onRefresh: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * IViewToolbar renders the control strip above the flowsheet grid.
 */
export default function IViewToolbar({
  timeInterval,
  showEmptyRows,
  timeRangeStart,
  timeRangeEnd,
  unsignedCount,
  onTimeIntervalChange,
  onShowEmptyRowsChange,
  onSign,
  onRefresh,
}: IViewToolbarProps) {
  /** Format a Date to HH:mm string. */
  const formatTime = (d: Date): string =>
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  /** Current time string, recomputed on render. */
  const currentTime = useMemo(() => formatTime(new Date()), []);

  return (
    <div className="iview-toolbar" role="toolbar" aria-label="iView controls">
      {/* Sign button */}
      <button
        className="iview-toolbar__btn iview-toolbar__btn--primary"
        onClick={onSign}
        disabled={unsignedCount === 0}
        title={
          unsignedCount > 0
            ? `Sign ${unsignedCount} unsigned entries`
            : 'No unsigned entries'
        }
      >
        ✍️ Sign{unsignedCount > 0 ? ` (${unsignedCount})` : ''}
      </button>

      {/* Refresh button */}
      <button
        className="iview-toolbar__btn"
        onClick={onRefresh}
        title="Refresh flowsheet data"
      >
        🔄 Refresh
      </button>

      <div className="iview-toolbar__separator" />

      {/* Time interval selector */}
      <div
        className="iview-toolbar__interval-group"
        role="radiogroup"
        aria-label="Time interval"
      >
        {TIME_INTERVALS.map(({ value, label }) => (
          <button
            key={value}
            className={`iview-toolbar__interval-btn${
              timeInterval === value ? ' iview-toolbar__interval-btn--active' : ''
            }`}
            onClick={() => onTimeIntervalChange(value)}
            role="radio"
            aria-checked={timeInterval === value}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="iview-toolbar__separator" />

      {/* Show empty rows toggle */}
      <label className="iview-toolbar__checkbox-label">
        <input
          type="checkbox"
          checked={showEmptyRows}
          onChange={(e) => onShowEmptyRowsChange(e.target.checked)}
        />
        Show empty rows
      </label>

      {/* Time range and current time */}
      <span className="iview-toolbar__time-range">
        {formatTime(timeRangeStart)} – {formatTime(timeRangeEnd)}
      </span>
      <span className="iview-toolbar__current-time" title="Current time">
        Now: {currentTime}
      </span>
    </div>
  );
}
