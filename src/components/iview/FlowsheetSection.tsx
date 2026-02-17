/**
 * @file FlowsheetSection.tsx
 * @description Time-columned flowsheet grid for a selected iView section.
 *
 * Renders a CSS grid where:
 * - First column: assessment parameter labels (sticky, 180px)
 * - Subsequent columns: time slots based on the configured interval
 * - Current time column highlighted in yellow
 * - Cells are clickable to open the AssessmentForm modal
 * - Pre-populated vital sign data and NEWS2 scores when the Vital Signs
 *   section is active
 *
 * The grid uses sticky positioning for the first column and header row
 * so the parameter labels and time headers remain visible when scrolling.
 */

import { useMemo } from 'react';
import type {
  IViewSection,
  AssessmentEntry,
  TimeInterval,
} from '../../types/iview';
import type { VitalSign, NEWS2Result } from '../../types';
import { calculateNEWS2 } from '../../services/newsCalculator';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props accepted by the FlowsheetSection component. */
export interface FlowsheetSectionProps {
  /** The section definition whose parameters form the grid rows. */
  section: IViewSection | null;

  /** Assessment entries for this section in the current timeframe. */
  entries: AssessmentEntry[];

  /** Time interval controlling column spacing. */
  timeInterval: TimeInterval;

  /** Start of the visible time range. */
  timeRangeStart: Date;

  /** End of the visible time range. */
  timeRangeEnd: Date;

  /** Whether to show rows with no documented values. */
  showEmptyRows: boolean;

  /** Patient vital signs for pre-populating the Vital Signs section. */
  vitals: VitalSign[];

  /** Callback when a flowsheet cell is clicked. */
  onCellClick: (parameterId: string, timeSlot: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map TimeInterval to milliseconds. */
function intervalToMs(interval: TimeInterval): number {
  const map: Record<TimeInterval, number> = {
    '1hr': 3600000,
    '2hr': 7200000,
    '4hr': 14400000,
    '8hr': 28800000,
    '12hr': 43200000,
  };
  return map[interval];
}

/** Generate time slot strings between start and end at the given interval. */
function generateTimeSlots(
  start: Date,
  end: Date,
  interval: TimeInterval,
): string[] {
  const slots: string[] = [];
  const stepMs = intervalToMs(interval);
  const current = new Date(start);

  while (current <= end) {
    slots.push(
      current.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    );
    current.setTime(current.getTime() + stepMs);
  }

  return slots;
}

/** Format a Date to HH:mm. */
function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/** Get current time slot (rounded down to nearest interval). */
function getCurrentTimeSlot(interval: TimeInterval): string {
  const now = new Date();
  const stepMs = intervalToMs(interval);
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const msSinceMidnight = now.getTime() - startOfDay.getTime();
  const slotsSinceMidnight = Math.floor(msSinceMidnight / stepMs);
  const slotTime = new Date(startOfDay.getTime() + slotsSinceMidnight * stepMs);

  return formatTime(slotTime);
}

/** Map a vital sign datetime to a time slot string. */
function vitalToTimeSlot(vital: VitalSign): string {
  const d = new Date(vital.datetime);
  return formatTime(d);
}

/**
 * Map a vital sign field key to its display value.
 * Returns the raw value for flowsheet rendering.
 */
function getVitalValue(
  vital: VitalSign,
  paramId: string,
): string | number | undefined {
  switch (paramId) {
    case 'temp':
      return vital.temp;
    case 'hr':
      return vital.hr;
    case 'rr':
      return vital.rr;
    case 'bp_sys':
      return vital.bp_sys != null && vital.bp_dia != null
        ? `${vital.bp_sys}/${vital.bp_dia}`
        : vital.bp_sys;
    case 'bp_dia':
      return vital.bp_dia;
    case 'spo2':
      return vital.spo2;
    case 'avpu':
      return vital.avpu;
    case 'supplementalO2':
      return vital.supplementalO2 ? 'Yes' : 'No';
    case 'painScore':
      return vital.painScore;
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Vital Signs section ID used to trigger vital sign pre-population. */
const VITAL_SIGNS_SECTION_ID = 'vital-signs';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * FlowsheetSection renders the time-columned grid for the currently
 * selected iView section, with cell interactivity and vital sign
 * pre-population.
 */
export default function FlowsheetSection({
  section,
  entries,
  timeInterval,
  timeRangeStart,
  timeRangeEnd,
  showEmptyRows,
  vitals,
  onCellClick,
}: FlowsheetSectionProps) {
  /** Generate time slot columns. */
  const timeSlots = useMemo(
    () => generateTimeSlots(timeRangeStart, timeRangeEnd, timeInterval),
    [timeRangeStart, timeRangeEnd, timeInterval],
  );

  /** Current time slot for column highlighting. */
  const currentSlot = useMemo(
    () => getCurrentTimeSlot(timeInterval),
    [timeInterval],
  );

  /** Whether this is the vital signs section. */
  const isVitalsSection = section?.id === VITAL_SIGNS_SECTION_ID;

  /** Map vitals by their time slot for quick lookup. */
  const vitalsBySlot = useMemo(() => {
    if (!isVitalsSection) return new Map<string, VitalSign>();
    const map = new Map<string, VitalSign>();
    for (const v of vitals) {
      const slot = vitalToTimeSlot(v);
      map.set(slot, v);
    }
    return map;
  }, [isVitalsSection, vitals]);

  /** NEWS2 results by time slot for the aggregate row. */
  const newsResultsBySlot = useMemo(() => {
    if (!isVitalsSection) return new Map<string, NEWS2Result>();
    const map = new Map<string, NEWS2Result>();
    for (const [slot, vital] of vitalsBySlot) {
      map.set(slot, calculateNEWS2(vital));
    }
    return map;
  }, [isVitalsSection, vitalsBySlot]);

  /** Look up a cell value from entries or pre-populated vitals. */
  function getCellValue(
    paramId: string,
    timeSlot: string,
  ): string | number | boolean | undefined {
    const entry = entries.find(
      (e) => e.parameterId === paramId && formatTime(new Date(e.timestamp)) === timeSlot,
    );
    if (entry) return entry.value;

    if (isVitalsSection) {
      const vital = vitalsBySlot.get(timeSlot);
      if (vital) return getVitalValue(vital, paramId);
    }

    return undefined;
  }

  /** Determine whether a row has any values across all time slots. */
  function rowHasValues(paramId: string): boolean {
    return timeSlots.some((slot) => getCellValue(paramId, slot) !== undefined);
  }

  // -- Empty state ----------------------------------------------------------

  if (!section) {
    return (
      <div className="iview-flowsheet-empty">
        <div>
          <div className="iview-flowsheet-empty__icon">📋</div>
          <div>Select a section from the navigator to begin documenting</div>
        </div>
      </div>
    );
  }

  // -- Filter parameters if hiding empty rows --------------------------------

  const displayParams = showEmptyRows
    ? section.parameters
    : section.parameters.filter((p) => rowHasValues(p.id));

  if (displayParams.length === 0 && !showEmptyRows) {
    return (
      <div className="iview-flowsheet-empty">
        <div>
          <div className="iview-flowsheet-empty__icon">📝</div>
          <div>No documented values in this section.</div>
          <div style={{ marginTop: 8, fontSize: 'var(--cerner-font-size-sm)' }}>
            Toggle "Show empty rows" to see all parameters.
          </div>
        </div>
      </div>
    );
  }

  // -- Calculate total rows including NEWS2 row ------------------------------

  const showNewsRow = isVitalsSection && newsResultsBySlot.size > 0;
  const totalRows = displayParams.length + (showNewsRow ? 1 : 0) + 1; // +1 for header

  return (
    <>
      {/* Section header */}
      <div className="iview-section-header">{section.name}</div>

      {/* Scrollable flowsheet grid */}
      <div className="iview-flowsheet-wrapper">
        <div
          className="iview-flowsheet-grid"
          style={{
            gridTemplateColumns: `180px repeat(${timeSlots.length}, minmax(80px, 1fr))`,
            gridTemplateRows: `repeat(${totalRows}, auto)`,
          }}
          role="grid"
          aria-label={`${section.name} flowsheet`}
        >
          {/* Corner cell */}
          <div className="iview-flowsheet-cell iview-flowsheet-cell--corner">
            Parameter
          </div>

          {/* Time header cells */}
          {timeSlots.map((slot) => (
            <div
              key={`hdr-${slot}`}
              className={`iview-flowsheet-cell iview-flowsheet-cell--header${
                slot === currentSlot ? ' iview-flowsheet-cell--current-time' : ''
              }`}
            >
              {slot}
            </div>
          ))}

          {/* Parameter rows */}
          {displayParams.map((param) => (
            <FlowsheetRow
              key={param.id}
              paramId={param.id}
              label={param.label}
              unit={param.unit}
              timeSlots={timeSlots}
              currentSlot={currentSlot}
              getCellValue={getCellValue}
              onCellClick={onCellClick}
            />
          ))}

          {/* NEWS2 aggregate score row */}
          {showNewsRow && (
            <NewsScoreRow
              timeSlots={timeSlots}
              currentSlot={currentSlot}
              newsResultsBySlot={newsResultsBySlot}
            />
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** A single parameter row in the flowsheet grid. */
function FlowsheetRow({
  paramId,
  label,
  unit,
  timeSlots,
  currentSlot,
  getCellValue,
  onCellClick,
}: {
  paramId: string;
  label: string;
  unit?: string;
  timeSlots: string[];
  currentSlot: string;
  getCellValue: (paramId: string, slot: string) => string | number | boolean | undefined;
  onCellClick: (paramId: string, slot: string) => void;
}) {
  return (
    <>
      {/* Label cell */}
      <div className="iview-flowsheet-cell iview-flowsheet-cell--label">
        {label}
        {unit && (
          <span style={{ fontWeight: 400, color: 'var(--cerner-muted)', marginLeft: 4 }}>
            ({unit})
          </span>
        )}
      </div>

      {/* Value cells */}
      {timeSlots.map((slot) => {
        const value = getCellValue(paramId, slot);
        const hasValue = value !== undefined && value !== '' && value !== false;
        const isCurrent = slot === currentSlot;

        const classNames = [
          'iview-flowsheet-cell',
          'iview-flowsheet-cell--interactive',
          isCurrent ? 'iview-flowsheet-cell--current-time' : '',
          hasValue ? 'iview-flowsheet-cell--documented' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <div
            key={`${paramId}-${slot}`}
            className={classNames}
            onClick={() => onCellClick(paramId, slot)}
            role="gridcell"
            tabIndex={0}
            title={hasValue ? `${label}: ${value}` : `Click to document ${label}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onCellClick(paramId, slot);
              }
            }}
          >
            {hasValue ? String(value) : ''}
          </div>
        );
      })}
    </>
  );
}

/** NEWS2 total score row displayed below vital sign parameters. */
function NewsScoreRow({
  timeSlots,
  currentSlot,
  newsResultsBySlot,
}: {
  timeSlots: string[];
  currentSlot: string;
  newsResultsBySlot: Map<string, NEWS2Result>;
}) {
  return (
    <>
      <div
        className="iview-flowsheet-cell iview-flowsheet-cell--label"
        style={{ fontWeight: 700, color: 'var(--cerner-dark-blue)' }}
      >
        NEWS2 Total
      </div>

      {timeSlots.map((slot) => {
        const result = newsResultsBySlot.get(slot);
        const isCurrent = slot === currentSlot;

        if (!result) {
          return (
            <div
              key={`news-${slot}`}
              className={`iview-flowsheet-cell iview-flowsheet-cell--news-total${
                isCurrent ? ' iview-flowsheet-cell--current-time' : ''
              }`}
            />
          );
        }

        const { totalScore } = result;
        const scoreLevel =
          totalScore >= 7 ? 3 : totalScore >= 5 ? 2 : totalScore >= 1 ? 1 : 0;

        return (
          <div
            key={`news-${slot}`}
            className={`iview-flowsheet-cell iview-flowsheet-cell--news-total${
              isCurrent ? ' iview-flowsheet-cell--current-time' : ''
            }`}
            style={{
              backgroundColor: `var(--news-score-${scoreLevel})`,
              color:
                scoreLevel >= 2
                  ? 'var(--news-score-text-light)'
                  : 'var(--news-score-text-dark)',
            }}
            title={`NEWS2: ${totalScore} (${result.clinicalRisk} risk)`}
          >
            {totalScore}
          </div>
        );
      })}
    </>
  );
}
