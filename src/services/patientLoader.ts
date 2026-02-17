/**
 * @file patientLoader.ts
 * @description Patient data loading service for the SimCerner EMR.
 *
 * Migrated from the `PatientDataLoader` class in emr-sim-v2.html.
 * Loads patient records from an external JSON manifest or falls back
 * to a hardcoded default patient (CAMPBELL, NATALIE – MRN PAH599806).
 *
 * Supports both the legacy flat JSON format (keys at root) and the
 * newer hierarchical format (demographics, admission, vitalSigns, etc.)
 * through the {@link normalizePatientData} function.
 */

import type {
  Patient,
  VitalSign,
  FluidBalanceEntry,
  Medication,
  MedicationStatus,
  Order,
  OrderStatus,
  OrderPriority,
  LabResult,
  LabResults,
  ClinicalNote,
  AVPUScale,
} from '../types';

// ---------------------------------------------------------------------------
// Logger (structured console logging)
// ---------------------------------------------------------------------------

/**
 * Log level constants matching the original Logger utility.
 * Structured console output with ISO-8601 timestamps.
 */
const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
} as const;

type LogLevel = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];

/**
 * Structured logger that mirrors the emr-sim-v2.html Logger utility.
 * Writes to `console` with timestamp + level prefix.
 */
const Logger = {
  /** Internal log ring-buffer (capped at 1 000 entries). */
  logs: [] as Array<{ timestamp: string; level: LogLevel; message: string; data: unknown }>,

  /** Core log method. */
  log(level: LogLevel, message: string, data: unknown = null): void {
    const timestamp = new Date().toISOString();
    const entry = { timestamp, level, message, data };
    this.logs.push(entry);
    if (this.logs.length > 1_000) {
      this.logs = this.logs.slice(-1_000);
    }
    // eslint-disable-next-line no-console
    console.log(`[${timestamp}] [${level}] ${message}`, data ?? '');
  },

  info(message: string, data?: unknown): void {
    this.log(LOG_LEVELS.INFO, message, data);
  },
  warn(message: string, data?: unknown): void {
    this.log(LOG_LEVELS.WARN, message, data);
  },
  error(message: string, data?: unknown): void {
    this.log(LOG_LEVELS.ERROR, message, data);
  },
  debug(message: string, data?: unknown): void {
    this.log(LOG_LEVELS.DEBUG, message, data);
  },
};

// ---------------------------------------------------------------------------
// Helpers – safe type coercion
// ---------------------------------------------------------------------------

/** Parse a value to number, returning `undefined` if NaN. */
function toNum(v: unknown): number | undefined {
  if (v == null) return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

/** Ensure a string value or return `undefined`. */
function toStr(v: unknown): string | undefined {
  return v == null ? undefined : String(v);
}

// ---------------------------------------------------------------------------
// Raw format interfaces (loosely typed incoming JSON)
// ---------------------------------------------------------------------------

/** Shape of a hierarchical patient JSON file (new format). */
interface RawHierarchicalPatient {
  demographics?: {
    mrn?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    age?: number | string;
    gender?: string;
    allergies?: string | string[];
  };
  admission?: {
    location?: string;
    attendingPhysician?: string;
    admissionDate?: string;
  };
  medicalHistory?: string[];
  vitalSigns?: Array<Record<string, unknown>>;
  fluidBalance?: Array<Record<string, unknown>>;
  medications?: Array<Record<string, unknown>>;
  orders?: Array<Record<string, unknown>>;
  labResults?: Record<string, Record<string, { value: string; unit: string; normalRange?: string; flag?: string }>>;
  clinicalNotes?: Array<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Load patients from the external manifest file (`/patients/patient-list.json`).
 * Falls back to the embedded default patient if the manifest is unavailable
 * or no patients can be loaded from the listed files.
 *
 * @returns Map of MRN → Patient.
 */
export async function loadPatients(): Promise<Record<string, Patient>> {
  try {
    Logger.info('Starting patient data load from external files');

    const manifestResponse = await fetch('patients/patient-list.json');

    if (!manifestResponse.ok) {
      Logger.warn('Patient manifest not found, trying default patients');
      return getDefaultPatients();
    }

    const manifest = (await manifestResponse.json()) as { patients: string[] };
    Logger.info('Patient manifest loaded', { count: manifest.patients.length });

    const results = await Promise.allSettled(
      manifest.patients.map((filename) => loadPatientFile(filename)),
    );

    const patients: Record<string, Patient> = {};

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        const patient = result.value;
        patients[patient.mrn] = patient;
        Logger.info('Patient loaded', { mrn: patient.mrn, name: patient.name });
      } else {
        Logger.warn('Failed to load patient file', {
          filename: manifest.patients[index],
          error: result.status === 'rejected' ? (result.reason as Error).message : 'unknown',
        });
      }
    });

    if (Object.keys(patients).length === 0) {
      Logger.warn('No patients loaded from files, using defaults');
      return getDefaultPatients();
    }

    Logger.info('Patient loading complete', { totalPatients: Object.keys(patients).length });
    return patients;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    Logger.error('Error loading patient data', { error: message });
    return getDefaultPatients();
  }
}

/**
 * Fetch and parse a single patient JSON file.
 *
 * @param filename - Filename relative to the `/patients/` directory.
 * @returns The normalised Patient record.
 * @throws If the fetch fails or the data is invalid.
 */
export async function loadPatientFile(filename: string): Promise<Patient> {
  try {
    const response = await fetch(`patients/${filename}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const rawPatient: unknown = await response.json();
    const patient = normalizePatientData(rawPatient);

    if (!patient.mrn || !patient.name) {
      throw new Error('Invalid patient data: missing mrn or name');
    }

    return patient;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    Logger.error('Error loading patient file', { filename, error: message });
    throw error;
  }
}

/**
 * Normalise raw patient data from either the flat or hierarchical
 * JSON format into the canonical {@link Patient} interface.
 *
 * **Flat format**: all fields (mrn, name, vitals, …) sit at the root.
 * **Hierarchical format**: data grouped under demographics, admission,
 * vitalSigns, medications, labResults, clinicalNotes, etc.
 *
 * @param raw - Untyped JSON payload from a patient file.
 * @returns A fully-formed Patient record with all required arrays.
 */
export function normalizePatientData(raw: unknown): Patient {
  if (!raw || typeof raw !== 'object') {
    throw new Error('normalizePatientData: input is not an object');
  }

  const data = raw as Record<string, unknown>;

  // ----- Flat format (already has mrn + name at root) ----------------------
  if (typeof data.mrn === 'string' && typeof data.name === 'string') {
    return ensureRequiredArrays(data as unknown as Partial<Patient>);
  }

  // ----- Hierarchical format -----------------------------------------------
  const h = data as unknown as RawHierarchicalPatient;
  const patient: Partial<Patient> = {};

  // Demographics
  if (h.demographics) {
    const d = h.demographics;
    patient.mrn = d.mrn ?? '';
    patient.name = [d.lastName, d.firstName].filter(Boolean).join(', ') || '';
    patient.dob = d.dateOfBirth ?? '';
    patient.age = typeof d.age === 'number' ? d.age : parseInt(String(d.age), 10) || 0;
    patient.gender = (d.gender as Patient['gender']) ?? 'Unknown';
    patient.allergies = Array.isArray(d.allergies)
      ? d.allergies
      : typeof d.allergies === 'string'
        ? d.allergies.split(',').map((a) => a.trim())
        : [];
  }

  // Admission
  if (h.admission) {
    patient.location = h.admission.location ?? '';
    patient.attending = h.admission.attendingPhysician ?? '';
    patient.admission = h.admission.admissionDate ?? '';
  }

  // Medical history
  patient.medicalHistory = Array.isArray(h.medicalHistory) ? h.medicalHistory : [];

  // Vital signs
  if (Array.isArray(h.vitalSigns)) {
    patient.vitals = h.vitalSigns.map<VitalSign>((vs) => ({
      datetime: toStr(vs.timestamp) ?? '',
      temp: toNum(vs.temperature),
      hr: toNum(vs.heartRate),
      rr: toNum(vs.respiratoryRate),
      bp_sys: toNum(vs.bloodPressureSystolic),
      bp_dia: toNum(vs.bloodPressureDiastolic),
      spo2: toNum(vs.oxygenSaturation),
      avpu: toStr(vs.avpu) as AVPUScale | undefined,
      supplementalO2: vs.supplementalOxygen === true,
      newsScore: toNum(vs.newsScore),
      painScore: toNum(vs.painScore),
    }));
  }

  // Fluid balance
  if (Array.isArray(h.fluidBalance)) {
    patient.fluidBalance = h.fluidBalance.map<FluidBalanceEntry>((fb) => ({
      datetime: toStr(fb.timestamp) ?? '',
      intake: Number(fb.intake) || 0,
      output: Number(fb.output) || 0,
      balance: Number(fb.balance) || 0,
      ivFluidType: toStr(fb.ivFluidType),
    }));
  }

  // Medications
  if (Array.isArray(h.medications)) {
    patient.medications = h.medications.map<Medication>((med) => ({
      name: String(med.name ?? ''),
      dose: String(med.dose ?? ''),
      route: String(med.route ?? ''),
      frequency: String(med.frequency ?? ''),
      scheduled: !String(med.frequency ?? '').includes('PRN'),
      times: [],
      lastGiven: toStr(med.administeredTime),
      prescriber: toStr(med.prescriber),
      administeredBy: toStr(med.administeredBy),
      status: (toStr(med.status) as MedicationStatus) ?? 'active',
    }));
  }

  // Orders
  if (Array.isArray(h.orders)) {
    patient.orders = h.orders.map<Order>((o) => ({
      id: String(o.id ?? `ORD-${Date.now()}`),
      type: (toStr(o.type) ?? 'Other') as Order['type'],
      name: String(o.description ?? o.name ?? ''),
      status: (toStr(o.status) ?? 'Ordered') as OrderStatus,
      ordered: toStr(o.orderedTime) ?? '',
      priority: (toStr(o.priority) ?? 'Routine') as OrderPriority,
    }));
  }

  // Lab results
  if (h.labResults && typeof h.labResults === 'object') {
    const lr = h.labResults;
    const transformCategory = (
      cat: Record<string, { value: string; unit: string; normalRange?: string; flag?: string }> | undefined,
    ): LabResult[] => {
      if (!cat) return [];
      return Object.entries(cat)
        .filter(([, d]) => d && d.value !== undefined)
        .map(([key, d]) => ({
          test: key,
          value: String(d.value),
          unit: d.unit ?? '',
          normalRange: d.normalRange,
          flag: (d.flag ?? '') as LabResult['flag'],
        }));
    };

    patient.results = {
      haematology: transformCategory(lr.haematology),
      biochemistry: transformCategory(lr.biochemistry),
      bloodGas: transformCategory(lr.bloodGas),
      coagulation: transformCategory(lr.coagulation),
      urinalysis: transformCategory(lr.urinalysis),
      cardiac: transformCategory(lr.cardiac),
    } satisfies LabResults;
  }

  // Clinical notes
  if (Array.isArray(h.clinicalNotes)) {
    patient.notes = h.clinicalNotes.map<ClinicalNote>((note, idx) => ({
      id: String(note.id ?? `note-${idx}`),
      type: (toStr(note.noteType) ?? 'Other') as ClinicalNote['type'],
      title: `${toStr(note.noteType) ?? 'Note'} - ${toStr(note.role) ?? ''}`,
      author: String(note.author ?? ''),
      datetime: toStr(note.timestamp) ?? '',
      content: String(note.content ?? ''),
      noteType: toStr(note.noteType),
      role: toStr(note.role) as ClinicalNote['role'],
    }));
  }

  return ensureRequiredArrays(patient);
}

/**
 * Return the hardcoded default patient data.
 *
 * **CAMPBELL, NATALIE** – MRN PAH599806
 * 58-year-old female admitted to PAH WMAPU with known penicillin allergy.
 *
 * @returns Map containing a single default patient keyed by MRN.
 */
export function getDefaultPatients(): Record<string, Patient> {
  const defaultPatient: Patient = {
    mrn: 'PAH599806',
    name: 'CAMPBELL, NATALIE',
    dob: '16-Nov-1967',
    age: 58,
    gender: 'Female',
    allergies: ['penicillin'],
    location: 'PAH 01 1 WMAPU: S7: 01',
    attending: 'KHOO, KEAN CHEANG SMO',
    admission: '28-Dec-2025 23:27:48 AEST',
    medicalHistory: [],

    vitals: [
      { datetime: '31-Dec-2025 16:00', temp: 36.7, hr: 78, rr: 15, bp_sys: 122, bp_dia: 76, spo2: 99, avpu: 'A' },
      { datetime: '31-Dec-2025 14:00', temp: 36.8, hr: 82, rr: 16, bp_sys: 125, bp_dia: 78, spo2: 98, avpu: 'A' },
      { datetime: '31-Dec-2025 10:00', temp: 37.1, hr: 88, rr: 18, bp_sys: 132, bp_dia: 82, spo2: 97, avpu: 'A' },
      { datetime: '31-Dec-2025 06:00', temp: 36.9, hr: 76, rr: 16, bp_sys: 128, bp_dia: 80, spo2: 98, avpu: 'A' },
      { datetime: '31-Dec-2025 02:00', temp: 37.0, hr: 80, rr: 17, bp_sys: 130, bp_dia: 81, spo2: 97, avpu: 'A' },
    ],

    fluidBalance: [
      { datetime: '31-Dec-2025 14:00', intake_oral: 200, intake_iv: 500, output_urine: 450, output_other: 0 },
      { datetime: '31-Dec-2025 10:00', intake_oral: 150, intake_iv: 500, output_urine: 400, output_other: 0 },
      { datetime: '31-Dec-2025 06:00', intake_oral: 100, intake_iv: 500, output_urine: 380, output_other: 0 },
    ],

    medications: [
      {
        name: 'ramipril',
        dose: '5 mg',
        route: 'Oral',
        frequency: 'TWICE a day',
        scheduled: true,
        times: ['0800', '2000'],
        lastGiven: '31-Dec-2025 08:00',
        status: 'active',
      },
      {
        name: 'paracetamol',
        dose: '1 g',
        route: 'Oral',
        frequency: 'PRN (up to 4 times daily)',
        scheduled: false,
        times: [],
        lastGiven: '30-Dec-2025 22:00',
        status: 'active',
      },
    ],

    orders: [
      {
        id: 'ORD001',
        type: 'Laboratory',
        name: 'Full Blood Count (FBC)',
        status: 'Completed',
        ordered: '31-Dec-2025 15:07',
        signed: '31-Dec-2025 15:07',
        priority: 'Routine',
      },
      {
        id: 'ORD002',
        type: 'Laboratory',
        name: 'Urea Electrolytes Creatinine (UEC)',
        status: 'Completed',
        ordered: '31-Dec-2025 15:07',
        signed: '31-Dec-2025 15:07',
        priority: 'Routine',
      },
    ],

    results: {
      haematology: [
        { test: 'White Cell Count', value: '8.4', unit: '×10⁹/L', range: '4.0-11.0', flag: '' },
        { test: 'Platelets', value: '245', unit: '×10⁹/L', range: '150-400', flag: '' },
        { test: 'Neutrophils', value: '5.2', unit: '×10⁹/L', range: '2.0-7.5', flag: '' },
      ],
      biochemistry: [
        { test: 'Sodium', value: '138', unit: 'mmol/L', range: '135-145', flag: '' },
        { test: 'Potassium', value: '4.2', unit: 'mmol/L', range: '3.5-5.0', flag: '' },
        { test: 'Creatinine', value: '95', unit: 'µmol/L', range: '50-120', flag: '' },
        { test: 'eGFR', value: '62', unit: 'mL/min', range: '>60', flag: 'L' },
      ],
      bloodGas: [],
      coagulation: [],
      urinalysis: [],
      cardiac: [],
    },

    notes: [
      {
        id: 'NOTE001',
        type: 'Progress',
        title: 'MARU RN AM',
        author: 'LODGE, THOMAS CHANDLER RN',
        datetime: '31-Dec-2025 11:01:55 AEST',
        content: `Taken over cares @0700
Pt alert and orientated upon interaction
Tolerating oral food/fluid
PIVC intact, patent and flushing
Vital signs as per interactive view
PIVC needs patience and flushing
Family in through out day
RN concerns voiced ATOR`,
      },
    ],
  };

  return { [defaultPatient.mrn]: defaultPatient };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Empty lab results scaffold used when data is missing. */
const EMPTY_RESULTS: LabResults = {
  haematology: [],
  biochemistry: [],
  bloodGas: [],
  coagulation: [],
  urinalysis: [],
  cardiac: [],
};

/**
 * Ensure all required array/object fields exist on a partial patient
 * record, filling in sensible empty defaults.
 */
function ensureRequiredArrays(partial: Partial<Patient>): Patient {
  return {
    mrn: partial.mrn ?? '',
    name: partial.name ?? '',
    dob: partial.dob ?? '',
    age: typeof partial.age === 'number' ? partial.age : parseInt(String(partial.age), 10) || 0,
    gender: partial.gender ?? 'Unknown',
    allergies: Array.isArray(partial.allergies)
      ? partial.allergies
      : typeof partial.allergies === 'string'
        ? (partial.allergies as string).split(',').map((a) => a.trim())
        : [],
    location: partial.location ?? '',
    attending: partial.attending ?? '',
    admission: partial.admission ?? '',
    medicalHistory: Array.isArray(partial.medicalHistory) ? partial.medicalHistory : [],
    vitals: partial.vitals ?? [],
    fluidBalance: partial.fluidBalance ?? [],
    medications: partial.medications ?? [],
    orders: partial.orders ?? [],
    results: partial.results ?? { ...EMPTY_RESULTS },
    notes: partial.notes ?? [],
  };
}
