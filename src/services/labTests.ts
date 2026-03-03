/**
 * @file labTests.ts
 * @description Comprehensive lab tests database for the SimCerner EMR.
 *
 * Extracted from inline constants in OrdersView. Provides the canonical
 * list of laboratory tests available for ordering, each categorised by
 * clinical discipline. Used by OrdersView autocomplete and SBAR summary.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single lab test entry in the catalogue. */
export interface LabTest {
  /** Display name of the test. */
  name: string;
  /** Clinical discipline / sub-category. */
  type: string;
  /** Broad order category (typically "Laboratory"). */
  category: string;
  /** Index signature for Autocomplete compatibility. */
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Lab Tests Catalogue
// ---------------------------------------------------------------------------

/** Full catalogue of orderable laboratory tests. */
export const LAB_TESTS: LabTest[] = [
  // Haematology
  { name: 'Full Blood Count (FBC)', type: 'Haematology', category: 'Laboratory' },
  { name: 'Coagulation Profile', type: 'Haematology', category: 'Laboratory' },
  { name: 'INR', type: 'Haematology', category: 'Laboratory' },
  { name: 'D-Dimer', type: 'Haematology', category: 'Laboratory' },
  { name: 'Blood Film', type: 'Haematology', category: 'Laboratory' },
  { name: 'ESR', type: 'Haematology', category: 'Laboratory' },
  { name: 'Reticulocyte Count', type: 'Haematology', category: 'Laboratory' },
  { name: 'Fibrinogen', type: 'Haematology', category: 'Laboratory' },

  // Biochemistry
  { name: 'Liver Function Test (LFT)', type: 'Biochemistry', category: 'Laboratory' },
  { name: 'Urea Electrolytes Creatinine (UEC)', type: 'Biochemistry', category: 'Laboratory' },
  { name: 'Calcium', type: 'Biochemistry', category: 'Laboratory' },
  { name: 'Magnesium', type: 'Biochemistry', category: 'Laboratory' },
  { name: 'Phosphate', type: 'Biochemistry', category: 'Laboratory' },
  { name: 'Troponin', type: 'Biochemistry', category: 'Laboratory' },
  { name: 'CK', type: 'Biochemistry', category: 'Laboratory' },
  { name: 'CRP', type: 'Biochemistry', category: 'Laboratory' },
  { name: 'Glucose (Random)', type: 'Biochemistry', category: 'Laboratory' },
  { name: 'Glucose (Fasting)', type: 'Biochemistry', category: 'Laboratory' },
  { name: 'HbA1c', type: 'Biochemistry', category: 'Laboratory' },
  { name: 'Lactate', type: 'Biochemistry', category: 'Laboratory' },
  { name: 'Lipase', type: 'Biochemistry', category: 'Laboratory' },
  { name: 'Amylase', type: 'Biochemistry', category: 'Laboratory' },
  { name: 'Uric Acid', type: 'Biochemistry', category: 'Laboratory' },
  { name: 'Albumin', type: 'Biochemistry', category: 'Laboratory' },
  { name: 'Osmolality (Serum)', type: 'Biochemistry', category: 'Laboratory' },
  { name: 'Procalcitonin', type: 'Biochemistry', category: 'Laboratory' },
  { name: 'BNP / NT-proBNP', type: 'Biochemistry', category: 'Laboratory' },

  // Toxicology
  { name: 'Paracetamol Level', type: 'Toxicology', category: 'Laboratory' },
  { name: 'Serum Ethanol', type: 'Toxicology', category: 'Laboratory' },
  { name: 'Serum Digoxin', type: 'Toxicology', category: 'Laboratory' },
  { name: 'Lithium Level', type: 'Toxicology', category: 'Laboratory' },
  { name: 'Salicylate Level', type: 'Toxicology', category: 'Laboratory' },

  // Blood Gas
  { name: 'Venous Blood Gas', type: 'Blood Gas', category: 'Laboratory' },
  { name: 'Arterial Blood Gas', type: 'Blood Gas', category: 'Laboratory' },

  // Vitamins & Nutritional
  { name: 'Vitamin D', type: 'Vitamins', category: 'Laboratory' },
  { name: 'B12 and Folate', type: 'Vitamins', category: 'Laboratory' },
  { name: 'Iron Studies', type: 'Vitamins', category: 'Laboratory' },
  { name: 'Thiamine (B1)', type: 'Vitamins', category: 'Laboratory' },

  // Microbiology
  { name: 'Rapid PCR (COVID, Influenza, RSV)', type: 'Microbiology', category: 'Laboratory' },
  { name: 'Respiratory Virus PCR', type: 'Microbiology', category: 'Laboratory' },
  { name: 'Urine MCS', type: 'Microbiology', category: 'Laboratory' },
  { name: 'Blood Culture', type: 'Microbiology', category: 'Laboratory' },
  { name: 'Wound Swab MCS', type: 'Microbiology', category: 'Laboratory' },
  { name: 'Sputum MCS', type: 'Microbiology', category: 'Laboratory' },
  { name: 'CSF MCS', type: 'Microbiology', category: 'Laboratory' },
  { name: 'Stool MCS', type: 'Microbiology', category: 'Laboratory' },
  { name: 'C. difficile Toxin', type: 'Microbiology', category: 'Laboratory' },

  // Cardiac Markers
  { name: 'High-Sensitivity Troponin', type: 'Cardiac', category: 'Laboratory' },
  { name: 'CK-MB', type: 'Cardiac', category: 'Laboratory' },
  { name: 'Myoglobin', type: 'Cardiac', category: 'Laboratory' },

  // Thyroid
  { name: 'Thyroid Function Tests (TFTs)', type: 'Thyroid', category: 'Laboratory' },
  { name: 'TSH', type: 'Thyroid', category: 'Laboratory' },

  // Urinalysis
  { name: 'Urine Dipstick', type: 'Urinalysis', category: 'Laboratory' },
  { name: 'Urine Protein:Creatinine Ratio', type: 'Urinalysis', category: 'Laboratory' },
  { name: 'Urine Osmolality', type: 'Urinalysis', category: 'Laboratory' },
  { name: 'Urine Drug Screen', type: 'Urinalysis', category: 'Laboratory' },

  // Immunology / Serology
  { name: 'Hepatitis B Surface Antigen', type: 'Serology', category: 'Laboratory' },
  { name: 'Hepatitis C Antibody', type: 'Serology', category: 'Laboratory' },
  { name: 'HIV Screen', type: 'Serology', category: 'Laboratory' },

  // Blood Bank
  { name: 'Group & Hold', type: 'Blood Bank', category: 'Laboratory' },
  { name: 'Crossmatch', type: 'Blood Bank', category: 'Laboratory' },

  // Imaging (non-lab, but orderable)
  { name: 'Chest X-Ray', type: 'Radiology', category: 'Imaging' },
  { name: 'CT Head', type: 'Radiology', category: 'Imaging' },
  { name: 'CT Abdomen/Pelvis', type: 'Radiology', category: 'Imaging' },
  { name: 'Ultrasound Abdomen', type: 'Radiology', category: 'Imaging' },
  { name: 'ECG (12-Lead)', type: 'Cardiology', category: 'Procedure' },
];
