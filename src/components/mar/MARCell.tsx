/**
 * @file MARCell.tsx
 * @description Individual cell in the Medication Administration Record grid.
 *
 * Renders a colour-coded cell based on dose status:
 * - GIVEN:     grey background, ✓ icon
 * - PENDING:   light blue, -- (no icon)
 * - DUE:       yellow highlight, ⏳ icon
 * - OVERDUE:   red tint, ⚠ icon
 * - REFUSED:   purple tint, ✕ icon
 * - HELD:      orange tint, ✋ icon
 * - NOT_GIVEN: grey, — icon
 * - FUTURE:    light grey dithered, no icon
 */

import { MedicationDoseStatus } from '../../types';
import '../../styles/components/views.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props accepted by MARCell. */
export interface MARCellProps {
  /** Current status of the dose for this time slot. */
  status: MedicationDoseStatus;
  /** Scheduled time label (e.g. "08:00"). */
  time: string;
  /** Click handler for opening the administration dialog. */
  onClick?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map dose status to a display icon. */
function getStatusIcon(status: MedicationDoseStatus): string {
  switch (status) {
    case MedicationDoseStatus.GIVEN:
      return '✓';
    case MedicationDoseStatus.DUE:
      return '⏳';
    case MedicationDoseStatus.OVERDUE:
      return '⚠';
    case MedicationDoseStatus.REFUSED:
      return '✕';
    case MedicationDoseStatus.HELD:
      return '✋';
    case MedicationDoseStatus.NOT_GIVEN:
      return '—';
    case MedicationDoseStatus.PENDING:
    case MedicationDoseStatus.FUTURE:
    default:
      return '';
  }
}

/** Map dose status to a CSS variable name for background colour. */
function getStatusCssVar(status: MedicationDoseStatus): string {
  switch (status) {
    case MedicationDoseStatus.GIVEN:
      return 'var(--mar-given)';
    case MedicationDoseStatus.DUE:
      return 'var(--mar-current)';
    case MedicationDoseStatus.OVERDUE:
      return 'var(--mar-overdue)';
    case MedicationDoseStatus.PENDING:
      return 'var(--mar-pending)';
    case MedicationDoseStatus.FUTURE:
      return 'var(--mar-future)';
    case MedicationDoseStatus.HELD:
      return 'var(--mar-held)';
    case MedicationDoseStatus.REFUSED:
      return 'var(--mar-refused)';
    case MedicationDoseStatus.NOT_GIVEN:
      return 'var(--mar-given)';
    default:
      return 'transparent';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * MARCell renders a single time-slot cell in the MAR grid, colour-coded
 * by administration status with an appropriate icon.
 */
export default function MARCell({ status, time, onClick }: MARCellProps) {
  const icon = getStatusIcon(status);
  const bg = getStatusCssVar(status);

  return (
    <div
      className={`mar-cell mar-cell--${status.toLowerCase()}`}
      style={{ backgroundColor: bg }}
      onClick={onClick}
      title={`${time} — ${status}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.();
      }}
    >
      {icon && <span className="mar-cell__icon">{icon}</span>}
    </div>
  );
}
