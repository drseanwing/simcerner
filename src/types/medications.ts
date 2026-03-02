/**
 * Medication Administration Record (MAR) types for the PowerChart EMR simulation.
 *
 * These types model the time-based MAR grid, where medications are displayed
 * as rows and scheduled times as columns. Each cell represents a single
 * administration event with its status, colour coding, and audit trail.
 */

import type { Medication } from './patient';

// ---------------------------------------------------------------------------
// Administration Status
// ---------------------------------------------------------------------------

/**
 * Possible statuses for a single medication administration cell.
 *
 * - 'pending'   : Scheduled but not yet due (blue)
 * - 'due'       : Currently within the administration window (yellow)
 * - 'overdue'   : Past the administration window without action (red)
 * - 'given'     : Successfully administered (grey/green checkmark)
 * - 'held'      : Intentionally withheld by clinician (hand icon)
 * - 'refused'   : Patient refused administration (X icon)
 * - 'not-given' : Not administered for another documented reason
 * - 'future'    : Scheduled for a future time, not yet actionable (dithered/greyed)
 */
export type AdministrationStatus =
  | 'pending'
  | 'due'
  | 'overdue'
  | 'given'
  | 'held'
  | 'refused'
  | 'not-given'
  | 'future';

// ---------------------------------------------------------------------------
// MAR Cell
// ---------------------------------------------------------------------------

/**
 * Data for a single cell in the MAR grid, representing one scheduled
 * administration time for a medication.
 */
export interface MARCellData {
  /** The scheduled administration time in 24-hour "HHMM" format, e.g. "0800" */
  scheduledTime: string;
  /** Current status of this administration event */
  status: AdministrationStatus;
  /** Name/ID of the clinician who administered the medication (when status is 'given') */
  administeredBy?: string;
  /** Actual timestamp when the medication was administered, e.g. "07-Apr-2021 08:05" */
  administeredAt?: string;
  /** Reason for holding, refusing, or not giving the medication */
  reason?: string;
}

// ---------------------------------------------------------------------------
// MAR Entry (Row)
// ---------------------------------------------------------------------------

/**
 * A single row in the MAR grid, combining a medication with its
 * time-based administration cells for the current display period.
 */
export interface MAREntry {
  /** The medication this row represents */
  medication: Medication;
  /** Administration cells for each scheduled time in the display period */
  cells: MARCellData[];
}

// ---------------------------------------------------------------------------
// Therapeutic Class
// ---------------------------------------------------------------------------

/**
 * A therapeutic medication class used to group medications in the MAR
 * navigator band (similar to Multum therapeutic classification).
 *
 * Examples: "Antihypertensives", "Insulins", "Anticoagulants", "Analgesics"
 */
export interface TherapeuticClass {
  /** Unique identifier for the therapeutic class */
  id: string;
  /** Display name of the therapeutic class, e.g. "Antihypertensives" */
  name: string;
  /** Medication names belonging to this class (references Medication.name) */
  medications: string[];
}

// ---------------------------------------------------------------------------
// MAR Display Configuration
// ---------------------------------------------------------------------------

/**
 * Colour mapping for MAR cell administration statuses.
 * Used to render the correct background colour in the MAR grid.
 */
export type MARStatusColor = Record<AdministrationStatus, string>;

/**
 * Time window configuration for determining MAR cell status transitions.
 * Values are in minutes relative to the scheduled time.
 */
export interface MARTimeWindow {
  /** Minutes before scheduled time when status transitions from 'future' to 'pending' */
  pendingBefore: number;
  /** Minutes before scheduled time when status transitions from 'pending' to 'due' */
  dueBefore: number;
  /** Minutes after scheduled time when status transitions from 'due' to 'overdue' */
  overdueAfter: number;
}
