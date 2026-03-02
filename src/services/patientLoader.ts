/**
 * Patient data loading service for the PowerChart EMR simulation.
 *
 * Loads patient records from JSON files served under `/patients/` (via a
 * manifest) and falls back to a hardcoded default when no external data is
 * available.  All raw payloads are normalised to the canonical {@link Patient}
 * shape before being returned.
 */

import type {
  Patient,
  VitalSign,
  FluidBalanceEntryNormalized,
  Medication,
  Order,
  LabResult,
  LabResults,
  ClinicalNote,
} from '@/types/patient';
import { getAllPatients, saveAllPatients } from '@/services/db';

// ---------------------------------------------------------------------------
// Raw-data shapes coming from the "new" hierarchical JSON format
// ---------------------------------------------------------------------------

interface RawDemographics {
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: string;
  gender: string;
  allergies: string;
}

interface RawAdmission {
  location: string;
  attendingPhysician: string;
  admissionDate: string;
}

interface RawVitalSign {
  timestamp: string;
  temperature: string;
  heartRate: string;
  respiratoryRate: string;
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  oxygenSaturation: string;
  avpu: string;
  supplementalOxygen?: boolean | string;
  newsScore?: number | Record<string, unknown>;
  painScore?: number | string;
}

interface RawFluidBalance {
  timestamp: string;
  intake: number;
  output: number;
  balance: number;
  ivFluidType?: string;
}

interface RawMedication {
  name: string;
  dose: string;
  route: string;
  frequency: string;
  administeredTime: string;
  prescriber?: string;
  administeredBy?: string;
  status?: string;
}

interface RawOrder {
  type: string;
  description: string;
  orderedBy: string;
  orderedTime: string;
  priority: string;
  status: string;
}

interface RawLabValue {
  value: string;
  unit: string;
  normalRange: string;
  flag: string;
}

interface RawLabCategory {
  [testName: string]: RawLabValue | undefined;
}

interface RawLabResults {
  haematology?: RawLabCategory;
  biochemistry?: RawLabCategory;
  bloodGas?: RawLabCategory;
  coagulation?: RawLabCategory;
  urinalysis?: RawLabCategory;
  cardiac?: RawLabCategory;
}

interface RawClinicalNote {
  noteType: string;
  role: string;
  author: string;
  timestamp: string;
  content: string;
}

interface RawPatientHierarchical {
  demographics?: RawDemographics;
  admission?: RawAdmission;
  medicalHistory?: string[];
  vitalSigns?: RawVitalSign[];
  fluidBalance?: RawFluidBalance[];
  medications?: RawMedication[];
  orders?: RawOrder[];
  labResults?: RawLabResults;
  clinicalNotes?: RawClinicalNote[];
  [key: string]: unknown;
}

/** Manifest format served by `/patients/patient-list.json`. */
interface PatientManifest {
  patients: string[];
}

// ---------------------------------------------------------------------------
// Helper: transform a raw lab category object into an array of LabResult
// ---------------------------------------------------------------------------

function transformLabCategory(category: RawLabCategory): LabResult[] {
  const results: LabResult[] = [];
  for (const [key, data] of Object.entries(category)) {
    if (data && data.value !== undefined) {
      results.push({
        test: key,
        value: data.value,
        unit: data.unit,
        normalRange: data.normalRange,
        flag: data.flag,
      });
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// normalizePatientData
// ---------------------------------------------------------------------------

/**
 * Normalise raw patient data from the new hierarchical format to the flat
 * {@link Patient} shape expected by the UI.
 *
 * If the payload is already in the flat format (i.e. has `mrn` and `name` at
 * the root level) it is returned as-is with sensible defaults for any missing
 * arrays.
 */
export function normalizePatientData(rawPatient: unknown): Patient {
  const raw = rawPatient as Record<string, unknown>;

  // If already in old flat format, return with defaults for missing arrays
  if (raw.mrn && raw.name) {
    const flat = raw as unknown as Patient;
    return {
      ...flat,
      vitals: flat.vitals ?? [],
      fluidBalance: flat.fluidBalance ?? [],
      medications: flat.medications ?? [],
      orders: flat.orders ?? [],
      results: flat.results ?? { haematology: [], biochemistry: [] },
      notes: flat.notes ?? [],
    };
  }

  // ---------- Transform hierarchical format ----------
  const hier = raw as RawPatientHierarchical;
  const patient: Partial<Patient> = {};

  // Demographics
  if (hier.demographics) {
    const demo = hier.demographics;
    patient.mrn = demo.mrn;
    patient.name = `${demo.lastName}, ${demo.firstName}`;
    patient.dob = demo.dateOfBirth;
    patient.age = demo.age;
    patient.gender = demo.gender;
    patient.allergies = demo.allergies;
  }

  // Admission
  if (hier.admission) {
    const adm = hier.admission;
    patient.location = adm.location;
    patient.attending = adm.attendingPhysician;
    patient.admission = adm.admissionDate;
  }

  // Medical History (array -> semicolon-separated string)
  if (hier.medicalHistory && Array.isArray(hier.medicalHistory)) {
    patient.medicalHistory = hier.medicalHistory.join('; ');
  }

  // Vital Signs
  if (hier.vitalSigns && Array.isArray(hier.vitalSigns)) {
    patient.vitals = hier.vitalSigns.map(
      (vs): VitalSign => ({
        datetime: vs.timestamp,
        temp: vs.temperature,
        hr: vs.heartRate,
        rr: vs.respiratoryRate,
        bp_sys: vs.bloodPressureSystolic,
        bp_dia: vs.bloodPressureDiastolic,
        spo2: vs.oxygenSaturation,
        avpu: vs.avpu,
        supplementalO2: vs.supplementalOxygen,
        painScore: vs.painScore,
      }),
    );
  }

  // Fluid Balance
  if (hier.fluidBalance && Array.isArray(hier.fluidBalance)) {
    patient.fluidBalance = hier.fluidBalance.map(
      (fb): FluidBalanceEntryNormalized => ({
        datetime: fb.timestamp,
        intake: fb.intake,
        output: fb.output,
        balance: fb.balance,
        ivFluidType: fb.ivFluidType,
      }),
    );
  }

  // Medications
  if (hier.medications && Array.isArray(hier.medications)) {
    patient.medications = hier.medications.map(
      (med): Medication => ({
        name: med.name,
        dose: med.dose,
        route: med.route,
        frequency: med.frequency,
        lastGiven: med.administeredTime,
        prescriber: med.prescriber,
        administeredBy: med.administeredBy,
        status: med.status,
        scheduled: !med.frequency?.includes('PRN'),
        times: [],
      }),
    );
  }

  // Orders
  if (hier.orders && Array.isArray(hier.orders)) {
    patient.orders = hier.orders.map(
      (order): Order => ({
        id: '',
        name: order.description,
        type: order.type,
        description: order.description,
        orderedBy: order.orderedBy,
        orderedTime: order.orderedTime,
        ordered: order.orderedTime,
        priority: order.priority,
        status: order.status,
        signed: true,
      }),
    );
  }

  // Lab Results
  if (hier.labResults) {
    const lr = hier.labResults;
    const results: LabResults = {
      haematology: lr.haematology ? transformLabCategory(lr.haematology) : [],
      biochemistry: lr.biochemistry
        ? transformLabCategory(lr.biochemistry)
        : [],
      bloodGas: lr.bloodGas ? transformLabCategory(lr.bloodGas) : undefined,
      coagulation: lr.coagulation
        ? transformLabCategory(lr.coagulation)
        : undefined,
      urinalysis: lr.urinalysis
        ? transformLabCategory(lr.urinalysis)
        : undefined,
      cardiac: lr.cardiac ? transformLabCategory(lr.cardiac) : undefined,
    };
    patient.results = results;
  }

  // Clinical Notes
  if (hier.clinicalNotes && Array.isArray(hier.clinicalNotes)) {
    patient.notes = hier.clinicalNotes.map(
      (note, idx): ClinicalNote => ({
        id: `note-${idx}`,
        title: `${note.noteType} - ${note.role}`,
        author: note.author,
        datetime: note.timestamp,
        content: note.content,
        noteType: note.noteType,
        role: note.role,
      }),
    );
  }

  // Ensure all required arrays / objects exist
  patient.vitals = patient.vitals ?? [];
  patient.fluidBalance = patient.fluidBalance ?? [];
  patient.medications = patient.medications ?? [];
  patient.orders = patient.orders ?? [];
  patient.results = patient.results ?? { haematology: [], biochemistry: [] };
  patient.notes = patient.notes ?? [];

  return patient as Patient;
}

// ---------------------------------------------------------------------------
// loadPatientFile
// ---------------------------------------------------------------------------

/**
 * Fetch and normalise a single patient JSON file from the `/patients/` path.
 *
 * @throws If the HTTP request fails or the payload is missing required fields.
 */
export async function loadPatientFile(filename: string): Promise<Patient> {
  try {
    const response = await fetch(`patients/${filename}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const rawPatient: unknown = await response.json();

    // Normalise to the expected format (supports both old and new formats)
    const patient = normalizePatientData(rawPatient);

    // Validate required fields
    if (!patient.mrn || !patient.name) {
      throw new Error('Invalid patient data: missing mrn or name');
    }

    return patient;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    console.error('[PatientLoader] Error loading patient file', {
      filename,
      error: message,
    });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// loadDefaultPatients
// ---------------------------------------------------------------------------

/**
 * Return the hardcoded CAMPBELL, NATALIE patient record keyed by MRN.
 *
 * This is the fallback when no external patient data is available.
 */
export function loadDefaultPatients(): Record<string, Patient> {
  console.info('[PatientLoader] Loading default embedded patients');

  return {
    PAH599806: {
      mrn: 'PAH599806',
      name: 'CAMPBELL, NATALIE',
      dob: '16-Nov-1967',
      age: '58 years',
      gender: 'F',
      allergies: 'penicillin',
      location: 'PAH 01 1 WMAPU: S7: 01',
      attending: 'KHOO, KEAN CHEANG SMO',
      admission: '28-Dec-2025 23:27:48 AEST',

      vitals: [
        { datetime: '31-Dec-2025 16:00', temp: '36.7', hr: '78', rr: '15', bp_sys: '122', bp_dia: '76', spo2: '99', avpu: 'Alert', o2FlowRate: 0 },
        { datetime: '31-Dec-2025 14:00', temp: '36.8', hr: '82', rr: '16', bp_sys: '125', bp_dia: '78', spo2: '98', avpu: 'Alert', o2FlowRate: 0 },
        { datetime: '31-Dec-2025 10:00', temp: '37.1', hr: '88', rr: '18', bp_sys: '132', bp_dia: '82', spo2: '97', avpu: 'Alert', o2FlowRate: 0 },
        { datetime: '31-Dec-2025 06:00', temp: '36.9', hr: '76', rr: '16', bp_sys: '128', bp_dia: '80', spo2: '98', avpu: 'Alert', o2FlowRate: 0 },
        { datetime: '31-Dec-2025 02:00', temp: '37.0', hr: '80', rr: '17', bp_sys: '130', bp_dia: '81', spo2: '97', avpu: 'Alert', o2FlowRate: 0 },
      ],

      fluidBalance: [
        { datetime: '31-Dec-2025 14:00', intake_oral: 200, intake_iv: 500, output_urine: 450, output_other: 0 },
        { datetime: '31-Dec-2025 10:00', intake_oral: 150, intake_iv: 500, output_urine: 400, output_other: 0 },
        { datetime: '31-Dec-2025 06:00', intake_oral: 100, intake_iv: 500, output_urine: 380, output_other: 0 },
      ],

      medications: [
        { name: 'furosemide', dose: '40 mg', route: 'Oral', frequency: 'THREE TIMES a day', scheduled: true, times: ['0800', '1400', '2000'], lastGiven: '31-Dec-2025 08:00' },
        { name: 'ramipril', dose: '5 mg', route: 'Oral', frequency: 'TWICE a day', scheduled: true, times: ['0800', '2000'], lastGiven: '31-Dec-2025 08:00' },
        { name: 'paracetamol', dose: '1 g', route: 'Oral', frequency: 'PRN (up to 4 times daily)', scheduled: false, times: [], lastGiven: '30-Dec-2025 22:00' },
      ],

      orders: [
        { id: 'ORD001', type: 'Laboratory', name: 'Full Blood Count (FBC)', status: 'Completed', ordered: '31-Dec-2025 15:07', signed: true },
        { id: 'ORD002', type: 'Laboratory', name: 'Urea Electrolytes Creatinine (UEC)', status: 'Completed', ordered: '31-Dec-2025 15:07', signed: true },
      ],

      results: {
        haematology: [
          { test: 'Haemoglobin', value: '112', unit: 'g/L', range: '115-165', flag: 'Low' },
          { test: 'White Cell Count', value: '8.4', unit: 'x10^9/L', range: '4.0-11.0', flag: '' },
          { test: 'Platelets', value: '245', unit: 'x10^9/L', range: '150-400', flag: '' },
          { test: 'Neutrophils', value: '5.2', unit: 'x10^9/L', range: '2.0-7.5', flag: '' },
        ],
        biochemistry: [
          { test: 'Sodium', value: '138', unit: 'mmol/L', range: '135-145', flag: '' },
          { test: 'Potassium', value: '4.2', unit: 'mmol/L', range: '3.5-5.0', flag: '' },
          { test: 'Creatinine', value: '95', unit: 'umol/L', range: '50-120', flag: '' },
          { test: 'eGFR', value: '62', unit: 'mL/min', range: '>60', flag: 'Low' },
        ],
      },

      notes: [
        {
          id: 'NOTE001',
          type: 'Progress Notes Inpatient',
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
    },
  };
}

// ---------------------------------------------------------------------------
// loadPatients
// ---------------------------------------------------------------------------

/**
 * Load all patient records.
 *
 * 1. Attempt to fetch `/patients/patient-list.json` (the manifest).
 * 2. For each entry in the manifest, fetch and normalise the corresponding
 *    JSON file.
 * 3. If the manifest is missing or no files load successfully, fall back to
 *    the embedded default patient(s).
 *
 * @returns A dictionary of {@link Patient} records keyed by MRN.
 */
export async function loadPatients(): Promise<Record<string, Patient>> {
  try {
    console.info('[PatientLoader] Starting patient data load from external files');

    // Try to load patient list manifest
    const manifestResponse = await fetch('patients/patient-list.json');

    if (!manifestResponse.ok) {
      console.warn('[PatientLoader] Patient manifest not found, trying cached/default patients');
      return loadFromCacheOrDefault();
    }

    const manifest = (await manifestResponse.json()) as PatientManifest;
    console.info('[PatientLoader] Patient manifest loaded', {
      count: manifest.patients.length,
    });

    // Load each patient file
    const patientPromises = manifest.patients.map((filename) =>
      loadPatientFile(filename),
    );

    const results = await Promise.allSettled(patientPromises);

    // Process results
    const patients: Record<string, Patient> = {};

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        const patient = result.value;
        patients[patient.mrn] = patient;
        console.info('[PatientLoader] Patient loaded', {
          mrn: patient.mrn,
          name: patient.name,
        });
      } else if (result.status === 'rejected') {
        console.warn('[PatientLoader] Failed to load patient file', {
          filename: manifest.patients[index],
          error: result.reason,
        });
      }
    });

    if (Object.keys(patients).length === 0) {
      console.warn('[PatientLoader] No patients loaded from files, using defaults');
      return loadFromCacheOrDefault();
    }

    // Persist to IndexedDB for offline use
    try {
      await saveAllPatients(Object.values(patients));
      console.info('[PatientLoader] Patient data cached in IndexedDB');
    } catch (cacheError) {
      console.warn('[PatientLoader] Failed to cache patients in IndexedDB', cacheError);
    }

    console.info('[PatientLoader] Patient loading complete', {
      totalPatients: Object.keys(patients).length,
    });
    return patients;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[PatientLoader] Error loading patient data', {
      error: message,
    });

    return loadFromCacheOrDefault();
  }
}

/**
 * Attempt to load patients from IndexedDB cache, falling back to embedded defaults.
 */
async function loadFromCacheOrDefault(): Promise<Record<string, Patient>> {
  try {
    const cached = await getAllPatients();
    if (cached.length > 0) {
      console.info('[PatientLoader] Loaded patients from IndexedDB cache', {
        count: cached.length,
      });
      const patients: Record<string, Patient> = {};
      for (const p of cached) {
        patients[p.mrn] = p;
      }
      return patients;
    }
  } catch (e) {
    console.warn('[PatientLoader] IndexedDB cache unavailable', e);
  }

  return loadDefaultPatients();
}
