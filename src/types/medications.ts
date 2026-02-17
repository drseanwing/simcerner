/**
 * @file medications.ts
 * @description Medication administration types for the SimCerner EMR application.
 *
 * Covers medication statuses, administration records, MAR (Medication
 * Administration Record) time-slot rendering, and therapeutic classification
 * used by the medication views and administration workflows.
 */

// ---------------------------------------------------------------------------
// Medication Status
// ---------------------------------------------------------------------------

/**
 * Lifecycle status of a scheduled medication dose on the MAR.
 *
 * | Status     | Meaning                                          |
 * |------------|--------------------------------------------------|
 * | PENDING    | Dose is scheduled but not yet actionable          |
 * | DUE        | Dose is within the administration window          |
 * | OVERDUE    | Administration window has passed without action   |
 * | GIVEN      | Dose was administered to the patient              |
 * | HELD       | Dose intentionally withheld (clinical decision)   |
 * | REFUSED    | Patient refused the dose                          |
 * | NOT_GIVEN  | Dose was not given for another documented reason  |
 * | FUTURE     | Dose is scheduled for a future time window        |
 */
export const MedicationDoseStatus = {
  PENDING: 'PENDING',
  DUE: 'DUE',
  OVERDUE: 'OVERDUE',
  GIVEN: 'GIVEN',
  HELD: 'HELD',
  REFUSED: 'REFUSED',
  NOT_GIVEN: 'NOT_GIVEN',
  FUTURE: 'FUTURE',
} as const;

export type MedicationDoseStatus = typeof MedicationDoseStatus[keyof typeof MedicationDoseStatus];

// ---------------------------------------------------------------------------
// Administration Records
// ---------------------------------------------------------------------------

/**
 * Record of a single medication administration event, capturing who
 * gave the dose, when, and any associated notes.
 */
export interface MedicationAdministration {
  /** ISO-8601 date-time when the dose was administered. */
  timestamp: string;

  /** Resulting status of the administration attempt. */
  status: MedicationDoseStatus;

  /** Name of the nurse who performed the administration. */
  nurse: string;

  /** Free-text notes (e.g. reason held, injection site, patient response). */
  notes?: string;
}

// ---------------------------------------------------------------------------
// MAR Time Slot
// ---------------------------------------------------------------------------

/**
 * Represents a single time slot on the Medication Administration Record.
 * Combines the scheduled time with administration outcome details.
 *
 * @example
 * ```ts
 * const slot: MARTimeSlot = {
 *   time: '08:00',
 *   status: MedicationDoseStatus.GIVEN,
 *   administration: {
 *     timestamp: '2026-02-17T08:05:00',
 *     status: MedicationDoseStatus.GIVEN,
 *     nurse: 'RN J. Carter',
 *   },
 * };
 * ```
 */
export interface MARTimeSlot {
  /** Scheduled administration time in HH:mm format. */
  time: string;

  /** Current status of this time slot. */
  status: MedicationDoseStatus;

  /** Administration details, populated once the slot has been actioned. */
  administration?: MedicationAdministration;
}

// ---------------------------------------------------------------------------
// Therapeutic Classification
// ---------------------------------------------------------------------------

/**
 * A therapeutic drug class grouping related medications together
 * for display and clinical decision support.
 *
 * @example
 * ```ts
 * const analgesics: TherapeuticClass = {
 *   id: 'analgesic',
 *   name: 'Analgesics',
 *   medications: ['Paracetamol', 'Ibuprofen', 'Morphine Sulfate'],
 * };
 * ```
 */
export interface TherapeuticClass {
  /** Unique identifier for the therapeutic class. */
  id: string;

  /** Human-readable class name. */
  name: string;

  /** List of medication names belonging to this class. */
  medications: string[];
}
