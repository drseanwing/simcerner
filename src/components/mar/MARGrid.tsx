/**
 * @file MARGrid.tsx
 * @description Time-based grid component for the Medication Administration Record.
 *
 * Generates time columns from 0000–2300 in configurable intervals (default 2 hours)
 * and maps medication scheduled times to the appropriate columns. Each cell is
 * rendered by {@link MARCell} with status determined by comparing scheduled times
 * against the current time and last-given timestamps.
 */

import { useMemo, useState } from 'react';
import type { Medication } from '../../types';
import { MedicationDoseStatus } from '../../types';
import MARCell from './MARCell';
import AdminDialog from './AdminDialog';
import '../../styles/components/views.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props accepted by MARGrid. */
export interface MARGridProps {
  /** Array of medications to display in the grid. */
  medications: Medication[];
  /** Current time used for determining cell status. Defaults to now. */
  currentTime?: Date;
  /** Interval between time columns in hours. Default 2. */
  intervalHours?: number;
}

/** Internal representation of a dialog state. */
interface DialogState {
  medication: Medication;
  time: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate an array of time-slot labels from 0000 to 2300 at the given
 * hour interval (e.g. ["00:00", "02:00", "04:00", ...]).
 */
function generateTimeSlots(intervalHours: number): string[] {
  const slots: string[] = [];
  for (let h = 0; h < 24; h += intervalHours) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
  }
  return slots;
}

/**
 * Parse a time string in "HH:mm" or "HHmm" format to total minutes since midnight.
 */
function parseTimeToMinutes(time: string): number {
  const cleaned = time.replace(':', '');
  const hours = parseInt(cleaned.substring(0, 2), 10);
  const minutes = parseInt(cleaned.substring(2, 4), 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Determine the dose status for a medication at a given time slot.
 */
function getCellStatus(
  medication: Medication,
  slotTime: string,
  currentMinutes: number,
  isScheduledSlot: boolean,
): MedicationDoseStatus {
  if (!isScheduledSlot) {
    return MedicationDoseStatus.FUTURE;
  }

  const slotMinutes = parseTimeToMinutes(slotTime);

  // If medication has a lastGiven timestamp, check if this slot was covered
  if (medication.lastGiven) {
    const lastGivenDate = new Date(medication.lastGiven);
    const lastGivenMinutes = lastGivenDate.getHours() * 60 + lastGivenDate.getMinutes();
    if (slotMinutes <= lastGivenMinutes) {
      return MedicationDoseStatus.GIVEN;
    }
  }

  // Window: ±60 minutes from current time
  if (slotMinutes <= currentMinutes - 60) {
    return MedicationDoseStatus.OVERDUE;
  }

  if (Math.abs(slotMinutes - currentMinutes) <= 60) {
    return MedicationDoseStatus.DUE;
  }

  if (slotMinutes > currentMinutes) {
    return MedicationDoseStatus.PENDING;
  }

  return MedicationDoseStatus.PENDING;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * MARGrid renders the time-based medication administration grid with
 * medication rows, time-slot columns, and colour-coded status cells.
 */
export default function MARGrid({
  medications,
  currentTime,
  intervalHours = 2,
}: MARGridProps) {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const now = currentTime ?? new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  /** Generate the set of time-slot labels. */
  const timeSlots = useMemo(() => generateTimeSlots(intervalHours), [intervalHours]);

  /** Only show scheduled (non-PRN) medications in the grid. */
  const scheduled = medications.filter((m) => m.scheduled);

  if (scheduled.length === 0) {
    return (
      <div className="text-muted" style={{ padding: 20, textAlign: 'center' }}>
        No scheduled medications for time grid display
      </div>
    );
  }

  return (
    <>
      <div className="mar-grid-wrapper">
        <div
          className="mar-grid"
          style={{
            gridTemplateColumns: `200px repeat(${timeSlots.length}, minmax(48px, 1fr))`,
          }}
        >
          {/* Header row */}
          <div className="mar-grid__header-cell">Medication</div>
          {timeSlots.map((slot) => (
            <div key={slot} className="mar-grid__header-cell mar-grid__header-cell--time">
              {slot}
            </div>
          ))}

          {/* Medication rows */}
          {scheduled.map((med, medIdx) => {
            const scheduledTimes = new Set(
              med.times.map((t) => {
                const mins = parseTimeToMinutes(t);
                const roundedHour = Math.round(mins / (intervalHours * 60)) * intervalHours;
                return `${String(roundedHour).padStart(2, '0')}:00`;
              }),
            );

            return (
              <MedRow
                key={medIdx}
                medication={med}
                timeSlots={timeSlots}
                scheduledTimes={scheduledTimes}
                currentMinutes={currentMinutes}
                onCellClick={(time) => setDialog({ medication: med, time })}
              />
            );
          })}
        </div>
      </div>

      {/* Administration dialog */}
      {dialog && (
        <AdminDialog
          medication={dialog.medication}
          scheduledTime={dialog.time}
          onConfirm={() => setDialog(null)}
          onCancel={() => setDialog(null)}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** A single medication row in the MAR grid. */
function MedRow({
  medication,
  timeSlots,
  scheduledTimes,
  currentMinutes,
  onCellClick,
}: {
  medication: Medication;
  timeSlots: string[];
  scheduledTimes: Set<string>;
  currentMinutes: number;
  onCellClick: (time: string) => void;
}) {
  return (
    <>
      <div className="mar-grid__med-cell">
        <div className="mar-grid__med-name">{medication.name}</div>
        <div className="mar-grid__med-detail">
          {medication.dose} | {medication.route} | {medication.frequency}
        </div>
      </div>
      {timeSlots.map((slot) => {
        const isScheduled = scheduledTimes.has(slot);
        const status = getCellStatus(medication, slot, currentMinutes, isScheduled);
        return (
          <MARCell
            key={slot}
            status={status}
            time={slot}
            onClick={isScheduled ? () => onCellClick(slot) : undefined}
          />
        );
      })}
    </>
  );
}
