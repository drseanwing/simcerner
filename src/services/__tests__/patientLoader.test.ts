import { describe, it, expect } from 'vitest';
import { normalizePatientData, getDefaultPatients } from '../patientLoader';

// ---------------------------------------------------------------------------
// normalizePatientData – flat format
// ---------------------------------------------------------------------------

describe('normalizePatientData – flat format', () => {
  it('passes through a flat patient record with required arrays', () => {
    const raw = {
      mrn: 'MRN-001',
      name: 'DOE, JANE',
      dob: '1990-01-15',
      age: 36,
      gender: 'Female',
      allergies: ['Latex'],
      location: 'Ward 3A',
      attending: 'Dr. Smith',
      admission: '2026-02-15',
      medicalHistory: ['Asthma'],
      vitals: [],
      fluidBalance: [],
      medications: [],
      orders: [],
      results: {
        haematology: [],
        biochemistry: [],
        bloodGas: [],
        coagulation: [],
        urinalysis: [],
        cardiac: [],
      },
      notes: [],
    };

    const patient = normalizePatientData(raw);
    expect(patient.mrn).toBe('MRN-001');
    expect(patient.name).toBe('DOE, JANE');
    expect(patient.allergies).toEqual(['Latex']);
    expect(patient.vitals).toEqual([]);
    expect(patient.medications).toEqual([]);
  });

  it('fills missing arrays with defaults for a minimal flat record', () => {
    const raw = { mrn: 'MRN-002', name: 'SMITH, BOB' };
    const patient = normalizePatientData(raw);

    expect(patient.mrn).toBe('MRN-002');
    expect(patient.name).toBe('SMITH, BOB');
    expect(patient.vitals).toEqual([]);
    expect(patient.medications).toEqual([]);
    expect(patient.orders).toEqual([]);
    expect(patient.notes).toEqual([]);
    expect(patient.results).toEqual({
      haematology: [],
      biochemistry: [],
      bloodGas: [],
      coagulation: [],
      urinalysis: [],
      cardiac: [],
    });
    expect(patient.medicalHistory).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// normalizePatientData – hierarchical format
// ---------------------------------------------------------------------------

describe('normalizePatientData – hierarchical format', () => {
  it('transforms demographics into flat fields', () => {
    const raw = {
      demographics: {
        mrn: 'H-MRN-001',
        firstName: 'Alice',
        lastName: 'Wonder',
        dateOfBirth: '1985-06-20',
        age: 40,
        gender: 'Female',
        allergies: ['Penicillin', 'Aspirin'],
      },
      admission: {
        location: 'ICU Bed 5',
        attendingPhysician: 'Dr. Heart',
        admissionDate: '2026-02-10',
      },
      medicalHistory: ['CHF', 'COPD'],
    };

    const patient = normalizePatientData(raw);
    expect(patient.mrn).toBe('H-MRN-001');
    expect(patient.name).toBe('Wonder, Alice');
    expect(patient.dob).toBe('1985-06-20');
    expect(patient.age).toBe(40);
    expect(patient.gender).toBe('Female');
    expect(patient.allergies).toEqual(['Penicillin', 'Aspirin']);
    expect(patient.location).toBe('ICU Bed 5');
    expect(patient.attending).toBe('Dr. Heart');
    expect(patient.admission).toBe('2026-02-10');
    expect(patient.medicalHistory).toEqual(['CHF', 'COPD']);
  });

  it('transforms vital signs from hierarchical fields', () => {
    const raw = {
      demographics: { mrn: 'H-MRN-002', firstName: 'Bob', lastName: 'Builder' },
      vitalSigns: [
        {
          timestamp: '2026-02-17T08:00:00',
          temperature: 37.2,
          heartRate: 88,
          respiratoryRate: 18,
          bloodPressureSystolic: 130,
          bloodPressureDiastolic: 80,
          oxygenSaturation: 97,
          avpu: 'A',
          supplementalOxygen: false,
        },
      ],
    };

    const patient = normalizePatientData(raw);
    expect(patient.vitals).toHaveLength(1);
    expect(patient.vitals[0].temp).toBe(37.2);
    expect(patient.vitals[0].hr).toBe(88);
    expect(patient.vitals[0].rr).toBe(18);
    expect(patient.vitals[0].bp_sys).toBe(130);
    expect(patient.vitals[0].bp_dia).toBe(80);
    expect(patient.vitals[0].spo2).toBe(97);
    expect(patient.vitals[0].avpu).toBe('A');
    expect(patient.vitals[0].supplementalO2).toBe(false);
  });

  it('transforms medications from hierarchical format', () => {
    const raw = {
      demographics: { mrn: 'H-MRN-003', firstName: 'Carol', lastName: 'Nurse' },
      medications: [
        {
          name: 'Metformin',
          dose: '500mg',
          route: 'PO',
          frequency: 'BD',
          status: 'active',
          prescriber: 'Dr. Sugar',
        },
      ],
    };

    const patient = normalizePatientData(raw);
    expect(patient.medications).toHaveLength(1);
    expect(patient.medications[0].name).toBe('Metformin');
    expect(patient.medications[0].dose).toBe('500mg');
    expect(patient.medications[0].route).toBe('PO');
    expect(patient.medications[0].scheduled).toBe(true);
  });

  it('marks PRN medications as not scheduled', () => {
    const raw = {
      demographics: { mrn: 'H-MRN-004', firstName: 'Dave', lastName: 'Pain' },
      medications: [
        {
          name: 'Morphine',
          dose: '5mg',
          route: 'IV',
          frequency: 'PRN',
          status: 'active',
        },
      ],
    };

    const patient = normalizePatientData(raw);
    expect(patient.medications[0].scheduled).toBe(false);
  });

  it('transforms lab results by category', () => {
    const raw = {
      demographics: { mrn: 'H-MRN-005', firstName: 'Eve', lastName: 'Lab' },
      labResults: {
        haematology: {
          Haemoglobin: { value: '135', unit: 'g/L', normalRange: '120-150', flag: '' },
        },
        biochemistry: {
          Sodium: { value: '140', unit: 'mmol/L', normalRange: '135-145', flag: '' },
          Potassium: { value: '5.5', unit: 'mmol/L', normalRange: '3.5-5.0', flag: 'H' },
        },
      },
    };

    const patient = normalizePatientData(raw);
    expect(patient.results.haematology).toHaveLength(1);
    expect(patient.results.haematology[0].test).toBe('Haemoglobin');
    expect(patient.results.haematology[0].value).toBe('135');
    expect(patient.results.biochemistry).toHaveLength(2);
    expect(patient.results.biochemistry[1].flag).toBe('H');
  });

  it('transforms clinical notes', () => {
    const raw = {
      demographics: { mrn: 'H-MRN-006', firstName: 'Frank', lastName: 'Notes' },
      clinicalNotes: [
        {
          id: 'CN-001',
          noteType: 'Progress',
          role: 'Nurse',
          author: 'RN Smith',
          timestamp: '2026-02-17T10:00:00',
          content: 'Patient stable.',
        },
      ],
    };

    const patient = normalizePatientData(raw);
    expect(patient.notes).toHaveLength(1);
    expect(patient.notes[0].id).toBe('CN-001');
    expect(patient.notes[0].author).toBe('RN Smith');
    expect(patient.notes[0].content).toBe('Patient stable.');
    expect(patient.notes[0].role).toBe('Nurse');
  });

  it('handles comma-separated allergies string', () => {
    const raw = {
      demographics: {
        mrn: 'H-MRN-007',
        firstName: 'Grace',
        lastName: 'Allergy',
        allergies: 'Penicillin, Sulfa, Latex',
      },
    };

    const patient = normalizePatientData(raw);
    expect(patient.allergies).toEqual(['Penicillin', 'Sulfa', 'Latex']);
  });

  it('handles age given as string', () => {
    const raw = {
      demographics: {
        mrn: 'H-MRN-008',
        firstName: 'Henry',
        lastName: 'Old',
        age: '72',
      },
    };

    const patient = normalizePatientData(raw);
    expect(patient.age).toBe(72);
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('normalizePatientData – error handling', () => {
  it('throws for null input', () => {
    expect(() => normalizePatientData(null)).toThrow('not an object');
  });

  it('throws for undefined input', () => {
    expect(() => normalizePatientData(undefined)).toThrow('not an object');
  });

  it('throws for non-object input', () => {
    expect(() => normalizePatientData('string')).toThrow('not an object');
    expect(() => normalizePatientData(42)).toThrow('not an object');
  });

  it('returns empty fields for hierarchical format with missing sections', () => {
    const raw = {
      demographics: { mrn: 'EMPTY-001', firstName: 'No', lastName: 'Data' },
    };

    const patient = normalizePatientData(raw);
    expect(patient.mrn).toBe('EMPTY-001');
    expect(patient.vitals).toEqual([]);
    expect(patient.medications).toEqual([]);
    expect(patient.orders).toEqual([]);
    expect(patient.notes).toEqual([]);
    expect(patient.fluidBalance).toEqual([]);
    expect(patient.medicalHistory).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getDefaultPatients
// ---------------------------------------------------------------------------

describe('getDefaultPatients', () => {
  it('returns a non-empty map', () => {
    const patients = getDefaultPatients();
    expect(Object.keys(patients).length).toBeGreaterThan(0);
  });

  it('contains the default patient with MRN PAH599806', () => {
    const patients = getDefaultPatients();
    expect(patients).toHaveProperty('PAH599806');
  });

  it('default patient has required fields', () => {
    const patients = getDefaultPatients();
    const p = patients['PAH599806'];

    expect(p.mrn).toBe('PAH599806');
    expect(p.name).toBe('CAMPBELL, NATALIE');
    expect(p.age).toBe(58);
    expect(p.gender).toBe('Female');
    expect(p.allergies).toContain('penicillin');
  });

  it('default patient has vitals array', () => {
    const patients = getDefaultPatients();
    const p = patients['PAH599806'];
    expect(Array.isArray(p.vitals)).toBe(true);
    expect(p.vitals.length).toBeGreaterThan(0);
  });

  it('default patient has medications', () => {
    const patients = getDefaultPatients();
    const p = patients['PAH599806'];
    expect(Array.isArray(p.medications)).toBe(true);
    expect(p.medications.length).toBeGreaterThan(0);
  });

  it('default patient has lab results structure', () => {
    const patients = getDefaultPatients();
    const p = patients['PAH599806'];
    expect(p.results).toBeDefined();
    expect(Array.isArray(p.results.haematology)).toBe(true);
    expect(Array.isArray(p.results.biochemistry)).toBe(true);
  });
});
