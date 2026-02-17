/**
 * @file patient.ts
 * @description Core patient data model interfaces for the SimCerner EMR application.
 *
 * Defines the complete patient record structure including demographics,
 * vital signs, fluid balance, medications, orders, lab results, and
 * clinical notes. Supports both flat and hierarchical data formats
 * used across different views of the application.
 */

// ---------------------------------------------------------------------------
// Demographics & Identity
// ---------------------------------------------------------------------------

/** Gender values supported by the patient record. */
export type Gender = 'Male' | 'Female' | 'Other' | 'Unknown';

/** AVPU consciousness scale used in vital sign observations. */
export type AVPUScale = 'A' | 'V' | 'P' | 'U';

/**
 * Core patient demographic and identity information.
 *
 * @example
 * ```ts
 * const demographics: PatientDemographics = {
 *   mrn: 'MRN-001234',
 *   name: 'Smith, John',
 *   dob: '1955-03-12',
 *   age: 71,
 *   gender: 'Male',
 *   allergies: ['Penicillin', 'Latex'],
 *   location: 'Ward 4B, Bed 12',
 *   attending: 'Dr. A. Williams',
 *   admission: '2026-02-10T08:30:00',
 *   medicalHistory: ['Type 2 Diabetes', 'Hypertension'],
 * };
 * ```
 */
export interface PatientDemographics {
  /** Medical Record Number – unique patient identifier. */
  mrn: string;

  /** Full patient name, typically "Last, First" format. */
  name: string;

  /** Date of birth in ISO-8601 date string (YYYY-MM-DD). */
  dob: string;

  /** Calculated age in years at time of encounter. */
  age: number;

  /** Patient gender. */
  gender: Gender;

  /** Known allergies. Empty array if NKDA (No Known Drug Allergies). */
  allergies: string[];

  /** Ward / bed location string, e.g. "Ward 4B, Bed 12". */
  location: string;

  /** Name of the attending clinician. */
  attending: string;

  /** Admission date-time in ISO-8601 format. */
  admission: string;

  /** List of relevant past medical history entries. */
  medicalHistory: string[];
}

// ---------------------------------------------------------------------------
// Vital Signs
// ---------------------------------------------------------------------------

/**
 * A single set of vital sign observations recorded at a point in time.
 *
 * All numeric fields are optional to allow partial charting (e.g. a
 * nurse may record only heart rate and SpO2 during a spot check).
 */
export interface VitalSign {
  /** ISO-8601 date-time when the observation was taken. */
  datetime: string;

  /** Core body temperature in °C. */
  temp?: number;

  /** Heart rate in beats per minute (bpm). */
  hr?: number;

  /** Respiratory rate in breaths per minute. */
  rr?: number;

  /** Systolic blood pressure in mmHg. */
  bp_sys?: number;

  /** Diastolic blood pressure in mmHg. */
  bp_dia?: number;

  /** Peripheral oxygen saturation as a percentage (0-100). */
  spo2?: number;

  /** AVPU consciousness level. */
  avpu?: AVPUScale;

  /** Whether the patient is receiving supplemental oxygen. */
  supplementalO2?: boolean;

  /** Calculated NEWS2 aggregate score for this observation set. */
  newsScore?: number;

  /** Patient-reported pain score (0-10 numeric rating scale). */
  painScore?: number;
}

// ---------------------------------------------------------------------------
// Fluid Balance
// ---------------------------------------------------------------------------

/**
 * Flat fluid balance entry — records individual intake/output values
 * broken down by route. Used in detailed charting views.
 */
export interface FluidBalanceEntryFlat {
  /** ISO-8601 date-time of the measurement period. */
  datetime: string;

  /** Oral fluid intake in mL. */
  intake_oral: number;

  /** Intravenous fluid intake in mL. */
  intake_iv: number;

  /** Urine output in mL. */
  output_urine: number;

  /** Other output (drains, vomit, etc.) in mL. */
  output_other: number;
}

/**
 * Hierarchical fluid balance entry — records pre-aggregated totals.
 * Used in summary and dashboard views.
 */
export interface FluidBalanceEntryHierarchical {
  /** ISO-8601 date-time of the measurement period. */
  datetime: string;

  /** Total fluid intake in mL. */
  intake: number;

  /** Total fluid output in mL. */
  output: number;

  /** Net balance (intake − output) in mL. May be negative. */
  balance: number;

  /** Type of IV fluid currently running, if applicable. */
  ivFluidType?: string;
}

/**
 * Union type supporting both flat and hierarchical fluid balance
 * data formats. Components should use type guards to differentiate.
 *
 * @example
 * ```ts
 * function isFlat(entry: FluidBalanceEntry): entry is FluidBalanceEntryFlat {
 *   return 'intake_oral' in entry;
 * }
 * ```
 */
export type FluidBalanceEntry = FluidBalanceEntryFlat | FluidBalanceEntryHierarchical;

// ---------------------------------------------------------------------------
// Medications
// ---------------------------------------------------------------------------

/** Current status of a medication order. */
export type MedicationStatus =
  | 'active'
  | 'held'
  | 'discontinued'
  | 'completed'
  | 'pending';

/**
 * A single medication entry on the patient's Medication Administration
 * Record (MAR).
 */
export interface Medication {
  /** Drug name (generic or brand). */
  name: string;

  /** Dose as a display string, e.g. "500 mg", "10 units". */
  dose: string;

  /** Route of administration, e.g. "PO", "IV", "SC", "IM". */
  route: string;

  /** Dosing frequency, e.g. "QDS", "BD", "STAT", "PRN". */
  frequency: string;

  /** Whether the medication follows a fixed schedule. */
  scheduled: boolean;

  /** Scheduled administration times as HH:mm strings. */
  times: string[];

  /** ISO-8601 date-time when the medication was last administered. */
  lastGiven?: string;

  /** Name of the prescribing clinician. */
  prescriber?: string;

  /** Name of the nurse who last administered the dose. */
  administeredBy?: string;

  /** Current order status. */
  status: MedicationStatus;
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

/** Category of clinical order. */
export type OrderType =
  | 'Laboratory'
  | 'Imaging'
  | 'Medication'
  | 'Procedure'
  | 'Consultation'
  | 'Nursing'
  | 'Diet'
  | 'Other';

/** Lifecycle status of an order. */
export type OrderStatus =
  | 'Ordered'
  | 'Signed'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'
  | 'Pending';

/** Clinical urgency of the order. */
export type OrderPriority = 'Routine' | 'Urgent' | 'STAT' | 'ASAP';

/**
 * A clinical order (lab, imaging, medication, etc.) placed for the patient.
 */
export interface Order {
  /** Unique order identifier. */
  id: string;

  /** Category of order. */
  type: OrderType;

  /** Display name / description of the order. */
  name: string;

  /** Current lifecycle status. */
  status: OrderStatus;

  /** ISO-8601 date-time when the order was placed. */
  ordered: string;

  /** ISO-8601 date-time when the order was signed/verified. */
  signed?: string;

  /** Clinical urgency. */
  priority: OrderPriority;
}

// ---------------------------------------------------------------------------
// Lab Results
// ---------------------------------------------------------------------------

/** Abnormality flag for a lab value. */
export type LabFlag = 'H' | 'L' | 'HH' | 'LL' | 'C' | 'normal' | '';

/**
 * A single laboratory test result.
 */
export interface LabResult {
  /** Name of the test, e.g. "Haemoglobin", "Sodium". */
  test: string;

  /** Result value as a display string (may include qualitative results). */
  value: string;

  /** Unit of measurement, e.g. "g/L", "mmol/L". */
  unit: string;

  /**
   * Normal reference range as a display string.
   * Field is named `range` or `normalRange` depending on the data source.
   */
  range?: string;

  /** Alias for `range` — some data sources use this key. */
  normalRange?: string;

  /** Abnormality flag indicating whether the result is out of range. */
  flag?: LabFlag;
}

/**
 * Grouped laboratory results organised by clinical discipline.
 * Each category contains an array of individual test results.
 */
export interface LabResults {
  /** Full blood count, film, ESR, etc. */
  haematology: LabResult[];

  /** Urea & electrolytes, LFTs, CRP, glucose, etc. */
  biochemistry: LabResult[];

  /** Arterial/venous blood gas analysis. */
  bloodGas: LabResult[];

  /** PT, APTT, INR, fibrinogen, D-dimer. */
  coagulation: LabResult[];

  /** Urine dipstick and microscopy results. */
  urinalysis: LabResult[];

  /** Troponin, BNP, CK-MB, and other cardiac markers. */
  cardiac: LabResult[];
}

// ---------------------------------------------------------------------------
// Clinical Notes
// ---------------------------------------------------------------------------

/** Type/category of clinical note. */
export type NoteType =
  | 'Progress'
  | 'Admission'
  | 'Discharge'
  | 'Consultation'
  | 'Procedure'
  | 'Nursing'
  | 'Handover'
  | 'Other';

/** Clinical role of the note author. */
export type ClinicalRole =
  | 'Physician'
  | 'Nurse'
  | 'Consultant'
  | 'Registrar'
  | 'Allied Health'
  | 'Pharmacist'
  | 'Other';

/**
 * A clinical note or documentation entry in the patient's chart.
 */
export interface ClinicalNote {
  /** Unique note identifier. */
  id: string;

  /** Broad classification of the note. */
  type: NoteType;

  /** Display title / subject line. */
  title: string;

  /** Name of the clinician who authored the note. */
  author: string;

  /** ISO-8601 date-time when the note was written. */
  datetime: string;

  /** Full text content of the note (may contain markdown). */
  content: string;

  /** Specific note sub-type for finer categorisation. */
  noteType?: string;

  /** Role of the author at the time of writing. */
  role?: ClinicalRole;
}

// ---------------------------------------------------------------------------
// Composite Patient Record
// ---------------------------------------------------------------------------

/**
 * Complete patient record combining demographics with all clinical data.
 *
 * This is the top-level type returned by patient data loaders and
 * consumed by the main application shell and all clinical views.
 *
 * @example
 * ```ts
 * const patient: Patient = {
 *   mrn: 'MRN-001234',
 *   name: 'Smith, John',
 *   dob: '1955-03-12',
 *   age: 71,
 *   gender: 'Male',
 *   allergies: ['Penicillin'],
 *   location: 'Ward 4B, Bed 12',
 *   attending: 'Dr. A. Williams',
 *   admission: '2026-02-10T08:30:00',
 *   medicalHistory: ['Type 2 Diabetes'],
 *   vitals: [],
 *   fluidBalance: [],
 *   medications: [],
 *   orders: [],
 *   results: {
 *     haematology: [],
 *     biochemistry: [],
 *     bloodGas: [],
 *     coagulation: [],
 *     urinalysis: [],
 *     cardiac: [],
 *   },
 *   notes: [],
 * };
 * ```
 */
export interface Patient extends PatientDemographics {
  /** Chronological vital sign observations. */
  vitals: VitalSign[];

  /** Fluid balance entries (may be flat or hierarchical). */
  fluidBalance: FluidBalanceEntry[];

  /** Active and historical medication records. */
  medications: Medication[];

  /** Clinical orders. */
  orders: Order[];

  /** Grouped laboratory results by discipline. */
  results: LabResults;

  /** Clinical documentation / notes. */
  notes: ClinicalNote[];
}
