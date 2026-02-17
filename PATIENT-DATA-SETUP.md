# Dynamic Patient Loading - Setup Guide

## Overview

The EMR simulation now loads patient data from external JSON files instead of hardcoded constants. This makes it easy to add, remove, or update patient scenarios without editing the HTML file.

## File Structure

```
emr-sim-v2.html           # Main simulation file
patients/                  # Patient data directory
├── patient-list.json      # Manifest listing all patient files
├── campbell-natalie.json  # Example patient with full data
└── dummy-patient.json     # Empty template patient
```

## How It Works

1. **Simulation starts** → Attempts to load `patients/patient-list.json`
2. **Reads manifest** → Gets list of patient JSON files to load
3. **Loads each patient** → Fetches and validates each JSON file
4. **Falls back to defaults** → If loading fails, uses embedded default patient

## Adding New Patients

### Method 1: Using JSON Files (Recommended)

1. **Create a new JSON file** in the `patients/` directory:
   ```bash
   patients/smith-john.json
   ```

2. **Add patient data** following the structure:
   ```json
   {
     "mrn": "PAH123456",
     "name": "SMITH, JOHN",
     "dob": "15-Mar-1980",
     "age": "45 years",
     "gender": "M",
     "allergies": "NKDA",
     "location": "ED Resus Bay 2",
     "attending": "DR JONES, SARAH",
     "admission": "31-Dec-2025 14:30:00 AEST",
     
     "vitals": [...],
     "fluidBalance": [...],
     "medications": [...],
     "orders": [...],
     "results": {...},
     "notes": [...]
   }
   ```

3. **Update the manifest** (`patients/patient-list.json`):
   ```json
   {
     "patients": [
       "campbell-natalie.json",
       "dummy-patient.json",
       "smith-john.json"        ← Add your new file
     ],
     "lastUpdated": "2025-12-31"
   }
   ```

4. **Refresh the simulation** - your new patient will appear in the search

### Method 2: Editing Existing Patients

1. Open any patient JSON file in `patients/` directory
2. Modify the data (vitals, medications, notes, etc.)
3. Save the file
4. Refresh the simulation

## Patient Data Structure

### Required Fields
- `mrn` - Medical Record Number (unique identifier)
- `name` - Patient name (format: LASTNAME, FIRSTNAME)
- `dob` - Date of birth
- `age` - Patient age
- `gender` - M/F/Other
- `allergies` - Allergy information

### Optional Fields
- `location` - Ward/bed location
- `attending` - Attending physician
- `admission` - Admission date/time

### Data Arrays (can be empty [])
- `vitals` - Vital signs entries
- `fluidBalance` - Fluid intake/output records
- `medications` - Current medications
- `orders` - Laboratory/imaging orders
- `notes` - Clinical documentation

### Vital Signs Entry Format
```json
{
  "datetime": "31-Dec-2025 14:00",
  "temp": "36.8",
  "hr": "82",
  "rr": "16",
  "bp_sys": "125",
  "bp_dia": "78",
  "spo2": "98",
  "avpu": "Alert"
}
```

### Fluid Balance Entry Format
```json
{
  "datetime": "31-Dec-2025 14:00",
  "intake_oral": 200,
  "intake_iv": 500,
  "output_urine": 450,
  "output_other": 0
}
```

### Medication Format
```json
{
  "name": "paracetamol",
  "dose": "1 g",
  "route": "Oral",
  "frequency": "PRN (up to 4 times daily)",
  "scheduled": false,
  "times": [],
  "lastGiven": "30-Dec-2025 22:00"
}
```

### Order Format
```json
{
  "id": "ORD001",
  "type": "Laboratory",
  "name": "Full Blood Count (FBC)",
  "status": "Completed",
  "ordered": "31-Dec-2025 15:07",
  "signed": true
}
```

### Lab Result Format
```json
{
  "test": "Haemoglobin",
  "value": "112",
  "unit": "g/L",
  "range": "115-165",
  "flag": "Low"
}
```

### Clinical Note Format
```json
{
  "id": "NOTE001",
  "type": "Progress Notes Inpatient",
  "title": "MARU RN AM",
  "author": "LODGE, THOMAS CHANDLER RN",
  "datetime": "31-Dec-2025 11:01:55 AEST",
  "content": "Patient assessment notes here.\nUse \\n for line breaks."
}
```

## Deployment Options

### Option 1: Web Server (Recommended)

Patient loading requires HTTP access. Deploy to:
- Shared web hosting
- Local web server (Apache, Nginx)
- Docker container with Nginx
- Node.js http-server

Example with Python:
```bash
python -m http.server 8000
# Then visit: http://localhost:8000/emr-sim-v2.html
```

### Option 2: File Protocol (Limited)

Opening `emr-sim-v2.html` directly in browser (file://) will fail to load JSON files due to CORS restrictions. The simulation will automatically fall back to embedded default patients.

## Troubleshooting

### Patients not loading
1. Check browser console (F12) for errors
2. Verify `patients/patient-list.json` exists and is valid JSON
3. Verify patient files listed in manifest exist
4. Check file paths are correct (relative to HTML file)
5. Ensure using HTTP protocol, not file://

### Invalid patient data
1. Validate JSON syntax (use jsonlint.com or similar)
2. Check required fields (mrn, name) are present
3. Ensure all arrays are properly closed with []
4. Check for trailing commas (not allowed in JSON)

### Patient appears but data missing
1. Check console for validation warnings
2. Verify data structure matches expected format
3. Ensure arrays (vitals, notes, etc.) are present even if empty

## Quick Test

1. Place these files in the same directory:
   ```
   emr-sim-v2.html
   patients/
   ├── patient-list.json
   └── campbell-natalie.json
   ```

2. Start a web server in that directory:
   ```bash
   python -m http.server 8000
   ```

3. Open browser to `http://localhost:8000/emr-sim-v2.html`

4. Search for "CAMPBELL" - patient should load with full data

## Logging

All patient loading activity is logged to browser console:
- Patient manifest loaded
- Each patient file loaded (success/failure)
- Validation errors
- Fallback to defaults

Press F12 and check the Console tab for detailed logs.

## Best Practices

1. **Use descriptive filenames**: `lastname-firstname.json`
2. **One patient per file**: Don't combine multiple patients
3. **Validate JSON**: Use a validator before deployment
4. **Keep backups**: Version control your patient files
5. **Test after changes**: Always refresh and verify
6. **Use templates**: Copy dummy-patient.json for new patients
7. **Document scenarios**: Add comments in manifest file

## Security Notes

- **Never use real patient data** - only fictional scenarios
- **Password protect** the entire directory in production
- **Use HTTPS** when deployed to internet
- **Restrict access** to authorized training personnel
- **Clear browser cache** after training sessions

## Example Workflow

Creating a new trauma scenario:

1. Copy template:
   ```bash
   cp patients/dummy-patient.json patients/trauma-case-01.json
   ```

2. Edit patient data:
   ```json
   {
     "mrn": "ED789456",
     "name": "TRAUMA, MAJOR",
     "dob": "22-Jul-1995",
     "age": "30 years",
     "gender": "M",
     "allergies": "NKDA",
     "location": "ED Resus Bay 1",
     "vitals": [
       {
         "datetime": "31-Dec-2025 15:00",
         "temp": "36.2",
         "hr": "118",
         "rr": "24",
         "bp_sys": "85",
         "bp_dia": "52",
         "spo2": "91",
         "avpu": "Voice"
       }
     ],
     "notes": [...]
   }
   ```

3. Add to manifest:
   ```json
   {
     "patients": [
       "campbell-natalie.json",
       "dummy-patient.json",
       "trauma-case-01.json"
     ]
   }
   ```

4. Test immediately - no need to edit HTML file!

## Advanced: Batch Loading

For larger deployments with many patients:

1. Organize by category:
   ```
   patients/
   ├── patient-list.json
   ├── cardiology-01.json
   ├── cardiology-02.json
   ├── respiratory-01.json
   ├── trauma-01.json
   └── ...
   ```

2. Update manifest with all files

3. Consider creating category-specific manifests if needed

## Support

For issues or questions:
1. Check browser console logs
2. Validate JSON files
3. Review patient data structure
4. Check deployment method (must use HTTP)
