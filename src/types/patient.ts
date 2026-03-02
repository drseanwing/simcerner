/**
 * Patient data model types for the PowerChart EMR simulation.
 *
 * These interfaces represent the "normalized" (flat) format that the application
 * works with internally. Raw JSON patient files and the legacy embedded data both
 * conform to these shapes after passing through normalizePatientData().
 */

// ---------------------------------------------------------------------------
// Vital Signs
// ---------------------------------------------------------------------------

/**
 * AVPU consciousness scale used in the Australian clinical context.
 */
export type AVPUScale = 'Alert' | 'Voice' | 'Changing Behaviour' | 'Pain' | 'Unresponsive';

/**
 * A single set of vital sign observations recorded at a point in time.
 *
 * Core fields (temp, hr, rr, bp_sys, bp_dia, spo2, avpu) are stored as strings
 * to match the JSON data format. Consumers should parse numeric values as needed.
 */
export interface VitalSign {
  /** Observation timestamp, e.g. "07-Apr-2021 14:00" */
  datetime: string;
  /** Temperature in degrees Celsius, e.g. "37.2" */
  temp: string;
  /** Heart rate in beats per minute, e.g. "92" */
  hr: string;
  /** Respiratory rate in breaths per minute, e.g. "20" */
  rr: string;
  /** Systolic blood pressure in mmHg, e.g. "145" */
  bp_sys: string;
  /** Diastolic blood pressure in mmHg, e.g. "88" */
  bp_dia: string;
  /** Peripheral oxygen saturation as a percentage, e.g. "96" */
  spo2: string;
  /** AVPU consciousness level */
  avpu: AVPUScale | string;

  // -- Optional fields for Q-ADDS scoring --

  /** Whether the patient is on supplemental oxygen */
  supplementalO2?: boolean | string;
  /** Oxygen flow rate in L/min (Q-ADDS scored parameter), e.g. "4" */
  o2FlowRate?: number | string;
  /** Nurse/staff concern flag — triggers escalation regardless of score */
  nurseConcern?: boolean;
  /** Pain score (0-10 numeric scale) */
  painScore?: number | string;
}

// ---------------------------------------------------------------------------
// Fluid Balance
// ---------------------------------------------------------------------------

/**
 * Fluid balance entry in the "flat" format used by the original JSON files
 * and the embedded default patient data. All volume values are in millilitres.
 */
export interface FluidBalanceEntryFlat {
  /** Timestamp of the recording period, e.g. "07-Apr-2021 12:00" */
  datetime: string;
  /** Oral fluid intake in mL */
  intake_oral: number;
  /** Intravenous fluid intake in mL */
  intake_iv: number;
  /** Urine output in mL */
  output_urine: number;
  /** Other output (drains, emesis, etc.) in mL */
  output_other: number;
}

/**
 * Fluid balance entry in the "normalized" format produced when converting
 * from the alternative (new-format) JSON structure via normalizePatientData().
 */
export interface FluidBalanceEntryNormalized {
  /** Timestamp of the recording period */
  datetime: string;
  /** Total intake value (pre-summed) */
  intake: number;
  /** Total output value (pre-summed) */
  output: number;
  /** Net balance (intake minus output) */
  balance: number;
  /** Type of IV fluid administered, if applicable */
  ivFluidType?: string;
}

/**
 * Union type representing either format of fluid balance entry.
 * The application should handle both shapes gracefully.
 */
export type FluidBalanceEntry = FluidBalanceEntryFlat | FluidBalanceEntryNormalized;

// ---------------------------------------------------------------------------
// Medications
// ---------------------------------------------------------------------------

/**
 * A single medication entry as stored in the patient record.
 *
 * The core fields (name, dose, route, frequency, scheduled, times, lastGiven)
 * are present in all JSON sources. Optional fields are populated when data is
 * normalized from the alternative input format.
 */
export interface Medication {
  /** Generic or brand medication name, e.g. "insulin aspart" */
  name: string;
  /** Dose with units, e.g. "8 units", "50 mg", "10 mL of 10%" */
  dose: string;
  /** Route of administration, e.g. "Oral", "IV", "Subcutaneous", "SC", "IM" */
  route: string;
  /** Frequency description, e.g. "TWICE a day", "PRN (up to 3 times daily)" */
  frequency: string;
  /** Whether the medication is on a fixed schedule (false for PRN medications) */
  scheduled: boolean;
  /** Scheduled administration times in 24-hour "HHMM" format, e.g. ["0800", "2000"] */
  times: string[];
  /** Timestamp of the last administration, or empty string if never given */
  lastGiven: string;

  // -- Optional fields from the normalized (new-format) data --

  /** Name of the prescribing clinician */
  prescriber?: string;
  /** Name/ID of the person who administered the medication */
  administeredBy?: string;
  /** Current status of the medication order */
  status?: string;
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

/**
 * A clinical order (laboratory, radiology, medication, consultation, etc.).
 */
export interface Order {
  /** Unique order identifier, e.g. "ORD001" */
  id: string;
  /** Order category: "Laboratory", "Radiology", "Medication", "Consultation", etc. */
  type: string;
  /** Descriptive name of the order, e.g. "Full Blood Count (FBC)" */
  name: string;
  /** Current order status: "Completed", "Active", "Pending", "Pending Signature" */
  status: string;
  /** Date/time the order was placed, e.g. "07-Apr-2021 08:00" */
  ordered: string;
  /** Whether the order has been co-signed by the ordering clinician */
  signed: boolean;
  /** Order priority level (populated when creating orders via the UI) */
  priority?: string;

  // -- Additional fields from the alternative (new-format) normalizer --

  /** Description field used by the new-format normalizer */
  description?: string;
  /** Name of the ordering clinician */
  orderedBy?: string;
  /** Timestamp when the order was placed (alternative field name) */
  orderedTime?: string;
}

// ---------------------------------------------------------------------------
// Lab Results
// ---------------------------------------------------------------------------

/**
 * A single laboratory result value.
 *
 * The `range` field corresponds to the original JSON "range" key.
 * The `normalRange` field is used when data is normalized from the alternative
 * input format. Consumers should check both fields.
 */
export interface LabResult {
  /** Name of the test, e.g. "Haemoglobin", "Potassium" */
  test: string;
  /** Result value as a string, e.g. "139", "9.1", "0.41" */
  value: string;
  /** Unit of measurement, e.g. "g/L", "mmol/L", or empty string */
  unit: string;
  /** Reference range in the original flat format, e.g. "120-180", ">60" */
  range?: string;
  /** Reference range from the normalized format, e.g. "120-180" */
  normalRange?: string;
  /** Abnormality flag: "", "Low", "High", "CRITICAL HIGH", "Critical", etc. */
  flag: string;
}

/**
 * Grouped laboratory results by category.
 *
 * The haematology and biochemistry arrays are always present (may be empty).
 * Additional categories are optional and populated based on available data.
 */
export interface LabResults {
  /** Full blood count, haemoglobin, WCC, platelets, etc. */
  haematology: LabResult[];
  /** Electrolytes (Na, K, Cl), renal function (Cr, eGFR, urea), glucose, etc. */
  biochemistry: LabResult[];
  /** Arterial or venous blood gas results (pH, pCO2, pO2, HCO3, lactate) */
  bloodGas?: LabResult[];
  /** Coagulation studies (INR, APTT, fibrinogen) */
  coagulation?: LabResult[];
  /** Urinalysis results */
  urinalysis?: LabResult[];
  /** Cardiac markers (troponin, BNP, CK) */
  cardiac?: LabResult[];
}

// ---------------------------------------------------------------------------
// Clinical Notes / Documentation
// ---------------------------------------------------------------------------

/**
 * A clinical documentation entry (progress note, admission note, nursing note, etc.).
 */
export interface ClinicalNote {
  /** Unique note identifier, e.g. "NOTE001" or "note-0" */
  id: string;
  /** Note category from the original format, e.g. "Progress Notes Inpatient", "Medical Admission Note" */
  type?: string;
  /** Brief display title, e.g. "Ward Round - Morning", "Admission - Emergency Department" */
  title: string;
  /** Author name with credentials, e.g. "DR SPACELY, GEORGE SMO" */
  author: string;
  /** Timestamp of the note, e.g. "07-Apr-2021 06:30:00 AEST" */
  datetime: string;
  /** Full text content of the clinical note (may contain newline characters) */
  content: string;

  // -- Optional fields from the normalized (new-format) data --

  /** Note type classification from the alternative format (e.g. "progress", "admission") */
  noteType?: string;
  /** Clinical role of the author (e.g. "Consultant", "Registrar", "RN") */
  role?: string;
}

// ---------------------------------------------------------------------------
// Top-Level Patient
// ---------------------------------------------------------------------------

/**
 * Complete patient record as used throughout the EMR simulation.
 *
 * This is the canonical shape after normalization. All views (vitals, MAR,
 * orders, results, documentation, fluid balance) read from this interface.
 */
export interface Patient {
  /** Medical record number, e.g. "RBWH789456", "PAH599806" */
  mrn: string;
  /** Patient name in "LASTNAME, FIRSTNAME" format */
  name: string;
  /** Date of birth, e.g. "07-Apr-1963" */
  dob: string;
  /** Age as a display string, e.g. "62 years" */
  age: string;
  /** Gender: "M", "F", or other values */
  gender: string;
  /** Allergy information, e.g. "NKDA", "penicillin", "Penicillin (rash), Morphine (nausea)" */
  allergies: string;
  /** Ward/unit location, e.g. "RBWH Ward 5A: Bed 12" */
  location: string;
  /** Attending physician, e.g. "DR SPACELY, GEORGE" */
  attending: string;
  /** Admission date/time, e.g. "07-Apr-2021 06:15:00 AEST" */
  admission: string;

  /** Vital sign observations in reverse chronological order (most recent first) */
  vitals: VitalSign[];
  /** Fluid balance records */
  fluidBalance: FluidBalanceEntry[];
  /** Current medication orders */
  medications: Medication[];
  /** Clinical orders (lab, radiology, etc.) */
  orders: Order[];
  /** Grouped laboratory results */
  results: LabResults;
  /** Clinical documentation entries */
  notes: ClinicalNote[];

  /**
   * Medical history as a semicolon-separated string.
   * Populated when normalizing from the alternative format where it arrives as an array.
   */
  medicalHistory?: string;
}

/**
 * A dictionary of patients keyed by MRN.
 * Used by the application store to hold all loaded patient records.
 */
export type PatientMap = Record<string, Patient>;
