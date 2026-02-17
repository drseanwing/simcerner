# EMR Patient JSON Creation Skill - Development Handoff

## Project Context

**Objective:** Create a skill that processes clinical forms (PDFs) and generates patient JSON files for an EMR simulation system.

**System Location:** 
- EMR Simulator: `/mnt/user-data/outputs/emr-sim-v2.html` (76KB)
- Patient Files: `/mnt/user-data/outputs/patients/`
- Patient Manifest: `/mnt/user-data/outputs/patients/patient-list.json`
- Existing Patients: `campbell-natalie.json`, `dummy-patient.json`, `jetson-judy.json`

## Skill Requirements (User-Specified)

### Processing Approach
- **Semi-automated:** Extract data, flag issues, ask for clarification on ambiguous values
- **Single patient from multiple forms:** Process all forms for one patient
- **Strict data fidelity:** Only use data explicitly present in forms - NO extrapolation, NO assumptions, NO invented data
- **Flag incomplete data:** Clearly identify missing/incomplete fields

### Clinical Forms to Process
- Fluid Balance Charts (MR A 12256)
- Medication Charts
- Progress Notes (Inpatient)
- Q-ADDS Charts (Queensland Adult Deterioration Detection System)
- VBG/Blood Gas Results (i-STAT CHEM8+, CG8+)
- IV/SC Fluid Order Forms
- Other Queensland Health clinical forms

### Quality Checks Required
- Validate required fields (MRN, name, DOB)
- Flag critical lab values (K+, creatinine, glucose, etc.)
- Note incomplete sections
- Ensure JSON structure validity
- Check data consistency across forms

## Complete JSON Schema

```json
{
  "patientId": "unique-patient-id",
  "demographics": {
    "mrn": "HOSPITAL-ID",
    "firstName": "FIRSTNAME",
    "lastName": "LASTNAME",
    "dateOfBirth": "DD-MMM-YYYY",
    "age": 62,
    "gender": "Male/Female",
    "allergies": "NKDA or list of allergies"
  },
  "admission": {
    "admissionDate": "DD-MMM-YYYY HH:MM:SS AEST/AEDT",
    "location": "Hospital Ward: Bed X",
    "attendingPhysician": "DR LASTNAME, FIRSTNAME"
  },
  "medicalHistory": [
    "Condition 1",
    "Condition 2"
  ],
  "vitalSigns": [
    {
      "timestamp": "DD-MMM-YYYY HH:MM:SS AEST/AEDT",
      "temperature": 37.2,
      "heartRate": 88,
      "respiratoryRate": 18,
      "bloodPressureSystolic": 130,
      "bloodPressureDiastolic": 80,
      "oxygenSaturation": 98,
      "supplementalOxygen": "Room air or L/min",
      "avpu": "Alert/Voice/Pain/Unresponsive",
      "painScore": 0,
      "newsScore": 0
    }
  ],
  "fluidBalance": [
    {
      "timestamp": "DD-MMM-YYYY HH:MM:SS AEST/AEDT",
      "intake": {
        "oral": 0,
        "iv": 0,
        "other": 0,
        "total": 0
      },
      "output": {
        "urine": 0,
        "drain": 0,
        "other": 0,
        "total": 0
      },
      "balance": 0
    }
  ],
  "medications": [
    {
      "name": "Medication Name",
      "dose": "10mg",
      "route": "PO/IV/SC/IM",
      "frequency": "BD/TDS/QID/PRN/STAT",
      "prescriber": "DR NAME",
      "administeredBy": "RN NAME",
      "administeredTime": "DD-MMM-YYYY HH:MM:SS AEST/AEDT",
      "status": "Given/Withheld/Refused"
    }
  ],
  "orders": [
    {
      "type": "Investigation/Imaging/Consult",
      "description": "Order description",
      "orderedBy": "DR NAME",
      "orderedTime": "DD-MMM-YYYY HH:MM:SS AEST/AEDT",
      "priority": "Routine/Urgent/STAT",
      "status": "Pending/Completed/Cancelled"
    }
  ],
  "labResults": {
    "haematology": {
      "haemoglobin": {"value": 139, "unit": "g/L", "normalRange": "115-165", "flag": ""},
      "haematocrit": {"value": 0.41, "unit": "L/L", "normalRange": "0.37-0.47", "flag": ""},
      "whiteCell": {"value": 0, "unit": "x10^9/L", "normalRange": "4.0-11.0", "flag": ""},
      "platelets": {"value": 0, "unit": "x10^9/L", "normalRange": "150-400", "flag": ""}
    },
    "biochemistry": {
      "sodium": {"value": 140, "unit": "mmol/L", "normalRange": "135-145", "flag": ""},
      "potassium": {"value": 4.0, "unit": "mmol/L", "normalRange": "3.2-4.5", "flag": ""},
      "chloride": {"value": 100, "unit": "mmol/L", "normalRange": "95-110", "flag": ""},
      "bicarbonate": {"value": 24, "unit": "mmol/L", "normalRange": "22-32", "flag": ""},
      "urea": {"value": 5.0, "unit": "mmol/L", "normalRange": "2.5-7.5", "flag": ""},
      "creatinine": {"value": 80, "unit": "µmol/L", "normalRange": "50-120", "flag": ""},
      "eGFR": {"value": 0, "unit": "mL/min/1.73m²", "normalRange": ">60", "flag": ""},
      "glucose": {"value": 5.5, "unit": "mmol/L", "normalRange": "3.0-7.8", "flag": ""},
      "calcium": {"value": 2.3, "unit": "mmol/L", "normalRange": "2.10-2.60", "flag": ""},
      "ionisedCalcium": {"value": 1.2, "unit": "mmol/L", "normalRange": "1.12-1.32", "flag": ""}
    },
    "bloodGas": {
      "pH": {"value": 7.40, "unit": "", "normalRange": "7.35-7.45", "flag": ""},
      "pO2": {"value": 0, "unit": "mmHg", "normalRange": "80-100", "flag": ""},
      "pCO2": {"value": 40, "unit": "mmHg", "normalRange": "35-45", "flag": ""},
      "HCO3": {"value": 24, "unit": "mmol/L", "normalRange": "22-26", "flag": ""},
      "baseExcess": {"value": 0, "unit": "mmol/L", "normalRange": "-2 to +2", "flag": ""},
      "lactate": {"value": 0, "unit": "mmol/L", "normalRange": "0.5-2.0", "flag": ""},
      "sampleType": "ABG/VBG"
    }
  },
  "clinicalNotes": [
    {
      "timestamp": "DD-MMM-YYYY HH:MM:SS AEST/AEDT",
      "author": "DR/RN NAME",
      "role": "Medical Officer/Registrar/Consultant/RN",
      "noteType": "Admission/Progress/Nursing/Ward Round",
      "content": "Detailed clinical note text..."
    }
  ]
}
```

## Skill Structure to Create

Following `/mnt/skills/examples/skill-creator/SKILL.md` pattern:

```
emr-patient-json/
├── SKILL.md (main skill instructions)
├── references/
│   ├── json-schema.json (complete schema reference)
│   ├── form-types.md (guide to Queensland Health forms)
│   ├── critical-values.md (lab value flags and thresholds)
│   └── examples.md (example extractions from real forms)
├── scripts/
│   ├── validate_patient_json.py (JSON structure validator)
│   └── check_critical_values.py (flag dangerous lab values)
└── assets/
    └── template-patient.json (blank JSON template)
```

## Workflow Design (Semi-Automated)

**Step 1: Initial Analysis**
- View all uploaded PDFs
- Identify form types
- Catalog available data

**Step 2: Data Extraction**
- Extract demographics (MRN, name, DOB, gender, allergies)
- Extract vital signs from Q-ADDS charts
- Extract lab results from VBG/pathology
- Extract medications from med charts
- Extract fluid balance
- Extract clinical notes

**Step 3: Quality Checks**
- Flag missing required fields (MRN, name, DOB)
- Flag critical lab values (K+ >5.5, Creat >200, etc.)
- Note incomplete sections
- Identify inconsistencies across forms

**Step 4: User Confirmation**
- Present extracted data summary
- Highlight critical findings
- Ask for clarification on ambiguous values
- Confirm patient scenario/diagnosis if unclear

**Step 5: JSON Generation**
- Create patient JSON file
- Update patient-list.json manifest
- Provide summary document

## Critical Values to Flag (Queensland Health Standards)

### Biochemistry
- **Potassium:** <2.5 or >6.0 mmol/L (CRITICAL)
- **Sodium:** <120 or >160 mmol/L
- **Glucose:** <2.5 or >25.0 mmol/L
- **Creatinine:** >500 µmol/L
- **Calcium:** <1.5 or >3.5 mmol/L

### Haematology
- **Haemoglobin:** <70 or >200 g/L
- **WCC:** <2.0 or >30.0 x10^9/L
- **Platelets:** <50 or >1000 x10^9/L

### Blood Gas
- **pH:** <7.20 or >7.60
- **Lactate:** >4.0 mmol/L

## Example Patient Files Available

Reference these for patterns:
- `/mnt/user-data/outputs/patients/jetson-judy.json` - Renal failure with hyperkalemia (most recent, comprehensive)
- `/mnt/user-data/outputs/patients/campbell-natalie.json` - Previous example
- `/mnt/user-data/outputs/patients/dummy-patient.json` - Template reference

## Previous Work Transcripts

- `/mnt/transcripts/2025-12-31-05-50-27-jetson-judy-patient-creation.txt` - Full Judy Jetson creation session
- `/mnt/transcripts/2025-12-31-05-49-33-emr-simulation-dynamic-loading.txt` - EMR system development

## Next Steps for New Conversation

1. User will provide additional example patient form packages
2. Initialize skill with: `python /mnt/skills/examples/skill-creator/scripts/init_skill.py emr-patient-json --path /home/claude/`
3. Analyze examples to identify patterns
4. Build references/ files (form types, critical values, examples)
5. Create validation scripts in scripts/
6. Write SKILL.md with semi-automated workflow
7. Test with real forms
8. Package skill: `python /mnt/skills/examples/skill-creator/scripts/package_skill.py /home/claude/emr-patient-json`

## Key Principles

✅ **Data Fidelity:** Never invent data - only extract what's explicitly present
✅ **Semi-Automation:** Flag issues, ask for clarification, confirm critical findings
✅ **Quality Focus:** Validate structure, check completeness, flag critical values
✅ **Single Patient:** Process multiple forms for one patient at a time
✅ **Clinical Safety:** Highlight dangerous values, incomplete data, inconsistencies
