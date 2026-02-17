# PowerChart EMR Simulation System

## Overview

This is a client-side Electronic Medical Record (EMR) simulation system designed to replicate the Cerner PowerChart interface for simulation training events at hospitals. The system provides a realistic EMR environment for educational purposes without requiring a backend server.

## Features

### Core Functionality
- **Patient Search**: Search and load patient records by name or MRN
- **Doctor View**: Quick overview of vital signs and recent clinical notes
- **Vital Signs/Deterioration View**: Comprehensive vital signs flow sheet
- **Medication Administration Record (MAR)**: Read-only view of all medications
- **Orders Workflow**: Add and sign pathology/laboratory orders
- **Clinical Documentation**: Browse and read clinical notes
- **Results View**: Display laboratory results (haematology and biochemistry)

### Technical Features
- **100% Client-Side**: No backend required - runs entirely in the browser
- **Comprehensive Logging**: All actions logged to browser console with timestamps
- **Error Handling**: Graceful degradation with user-friendly error messages
- **Modular Design**: Clean component structure for easy maintenance
- **Responsive Interface**: Closely replicates Cerner PowerChart visual design

## Quick Start

### Option 1: Shared Web Hosting
1. Upload `emr-sim.html` to your web hosting
2. Access via browser: `https://yourdomain.com/emr-sim.html`
3. No server configuration needed - it's a static HTML file

### Option 2: Docker Container (VPS)

Create a `Dockerfile`:
```dockerfile
FROM nginx:alpine
COPY emr-sim.html /usr/share/nginx/html/index.html
EXPOSE 80
```

Build and run:
```bash
docker build -t emr-sim .
docker run -d -p 8080:80 emr-sim
```

Access at: `http://your-vps-ip:8080`

### Option 3: Local Development
Simply open `emr-sim.html` in a web browser. All dependencies are loaded from CDNs.

## Usage Instructions

### Logging In
1. Open the application in a web browser
2. The patient search screen will appear automatically

### Searching for Patients
1. Enter patient name or MRN in the search box
2. Click on a patient from the results list to load their record

**Sample Patients Included:**
- `CAMPBELL, NATALIE` (MRN: PAH599806) - Full patient record with vitals, medications, orders
- `DUMMY, DUMMY` (MRN: LABH999999) - Empty template for testing

### Navigating the Interface

**Left Sidebar Menu:**
- **Doctor View**: Overview dashboard with vitals and recent notes
- **Managing Deterioration**: Detailed vital signs flow sheet
- **Orders**: View existing orders and add new laboratory orders
- **Results**: View laboratory test results
- **Documentation**: Browse all clinical notes
- **MAR**: View medication administration record

**Top Menu Bar:**
- Click **Patient** to return to patient search and change patients

### Adding Laboratory Orders
1. Navigate to **Orders** from the sidebar
2. Fill in the order form:
   - Order Type (Laboratory, Radiology, etc.)
   - Order Details (e.g., "Full Blood Count")
   - Priority (Routine, Urgent, STAT)
3. Click **Add Order**
4. Order will appear in the current orders table
5. Click **Sign** to electronically sign the order

### Viewing Clinical Notes
1. Navigate to **Documentation** from the sidebar
2. Click on any note header to expand/collapse the full text
3. Notes display author, timestamp, and full content

## Adding New Patients

### Patient Data Structure

Patient data is stored in the `SAMPLE_PATIENTS` object within the HTML file. Here's the structure:

```javascript
'MRN_NUMBER': {
    // Demographics
    mrn: 'PAH599806',
    name: 'LASTNAME, FIRSTNAME',
    dob: '16-Nov-1967',
    age: '58 years',
    gender: 'F',
    allergies: 'penicillin',
    location: 'PAH 01 1 WMAPU: S7: 01',
    attending: 'PHYSICIAN NAME',
    admission: '28-Dec-2025 23:27:48 AEST',
    
    // Vital Signs Array
    vitals: [
        {
            datetime: '31-Dec-2025 14:00',
            temp: '36.8',
            hr: '82',
            rr: '16',
            bp_sys: '125',
            bp_dia: '78',
            spo2: '98',
            avpu: 'Alert'
        }
    ],
    
    // Medications Array
    medications: [
        {
            name: 'furosemide',
            dose: '40 mg',
            route: 'Oral',
            frequency: 'THREE TIMES a day',
            scheduled: true,
            times: ['0800', '1400', '2000'],
            lastGiven: '31-Dec-2025 08:00'
        }
    ],
    
    // Orders Array
    orders: [
        {
            id: 'ORD001',
            type: 'Laboratory',
            name: 'Full Blood Count',
            status: 'Completed',
            ordered: '31-Dec-2025 15:07',
            signed: true
        }
    ],
    
    // Laboratory Results
    results: {
        haematology: [
            { 
                test: 'Haemoglobin', 
                value: '112', 
                unit: 'g/L', 
                range: '115-165', 
                flag: 'Low' 
            }
        ],
        biochemistry: [
            { 
                test: 'Sodium', 
                value: '138', 
                unit: 'mmol/L', 
                range: '135-145', 
                flag: '' 
            }
        ]
    },
    
    // Clinical Notes Array
    notes: [
        {
            id: 'NOTE001',
            type: 'Progress Notes Inpatient',
            title: 'MARU RN AM',
            author: 'LODGE, THOMAS CHANDLER RN',
            datetime: '31-Dec-2025 11:01:55 AEST',
            content: `Patient assessment text here...`
        }
    ]
}
```

### Adding a New Patient

1. Open `emr-sim.html` in a text editor
2. Locate the `SAMPLE_PATIENTS` constant (around line 300)
3. Add a new patient object following the structure above
4. Save the file
5. Refresh the browser to see the new patient in search results

### Creating Patient Data from JSON Files

To keep patient data in separate JSON files:

1. Create a JSON file (e.g., `patient-data.json`) with patient records
2. Modify the application to load from external JSON:

```javascript
// Add this in the useEffect hook
useEffect(() => {
    fetch('patient-data.json')
        .then(response => response.json())
        .then(data => {
            SAMPLE_PATIENTS = data;
            Logger.info('Patient data loaded from external file');
        })
        .catch(error => {
            Logger.error('Failed to load patient data', error);
        });
}, []);
```

## Security and Privacy

### IMPORTANT SECURITY NOTES

⚠️ **CONFIDENTIAL DATA HANDLING**

This system is designed for **simulation training only** and contains features for handling patient data. When using in production:

1. **Never use real patient data** in the simulation system
2. **Use de-identified or fictional patient records only**
3. **Password protect** the directory containing the simulation files
4. **Use HTTPS** for all access to the simulation
5. **Restrict access** to authorized training personnel only
6. **Clear browser cache** after training sessions
7. **Do not index** the simulation site in search engines (use robots.txt)

### Access Control Recommendations

For shared web hosting:
```apache
# .htaccess file to password protect
AuthType Basic
AuthName "EMR Simulation Access"
AuthUserFile /path/to/.htpasswd
Require valid-user
```

For Docker deployment:
```nginx
# Add basic auth to nginx.conf
location / {
    auth_basic "EMR Simulation";
    auth_basic_user_file /etc/nginx/.htpasswd;
}
```

### robots.txt
```
User-agent: *
Disallow: /
```

## Browser Logging

All application events are logged to the browser console with the following format:
```
[2025-12-31T15:07:00.000Z] [INFO] Patient loaded successfully { mrn: 'PAH599806', name: 'CAMPBELL, NATALIE' }
```

### Log Levels
- **INFO**: Normal operations (patient loaded, view changed)
- **WARN**: Non-critical issues (patient not found)
- **ERROR**: Critical failures (data loading errors)
- **DEBUG**: Detailed diagnostic information

### Accessing Logs
1. Open browser Developer Tools (F12)
2. Navigate to Console tab
3. All application logs will be visible

### Exporting Logs
The Logger object maintains an in-memory log buffer. To export:
```javascript
// In browser console:
console.log(Logger.exportLogs());
```

## Customization

### Visual Styling

The application uses CSS variables for the Cerner color scheme:
```css
:root {
    --cerner-blue: #0066b2;
    --cerner-dark-blue: #004578;
    --cerner-light-blue: #e6f2ff;
    --cerner-header-blue: #3a87ad;
    --cerner-nav-bg: #2c3e50;
    /* ... */
}
```

Modify these values to match your institution's EMR branding.

### Adding New Views

To add a new section (e.g., Imaging):

1. **Add sidebar menu item:**
```javascript
const menuItems = [
    // ... existing items
    { id: 'imaging', label: 'Imaging', section: 'Menu' },
];
```

2. **Create component:**
```javascript
function ImagingView({ patient }) {
    return (
        <>
            <div className="content-header">🔍 Imaging</div>
            <div className="content-body">
                {/* Your content here */}
            </div>
        </>
    );
}
```

3. **Add to main render:**
```javascript
{currentView === 'imaging' && (
    <ImagingView patient={currentPatient} />
)}
```

## File Structure

```
emr-sim/
├── emr-sim.html          # Complete standalone application
├── README.md             # This documentation
├── patient-template.json # Template for adding patients
└── logs/                 # Optional: Server-side log storage
```

## Browser Compatibility

Tested and working on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

**Note:** Internet Explorer is not supported.

## Dependencies

All dependencies are loaded via CDN:
- React 18 (production build)
- ReactDOM 18 (production build)
- Babel Standalone (for JSX transformation)

No npm install or build process required.

## Troubleshooting

### Patient doesn't load
- Check browser console for errors
- Verify patient MRN exists in SAMPLE_PATIENTS object
- Clear browser cache and reload

### Styling looks incorrect
- Ensure you're using a modern browser
- Check for CSS conflicts if embedding in another page
- Verify all styles loaded correctly in browser inspector

### Orders not saving
- Orders are only stored in memory during the session
- Data will reset when page is refreshed
- This is intentional for simulation purposes

### Console shows errors
- Check the error message in browser console
- Review the Logger output for diagnostic information
- Ensure patient data structure matches the template

## Support and Maintenance

### Updating Patient Data
Patient data is hard-coded in the HTML file. For frequent updates, consider:
1. Moving patient data to external JSON files
2. Creating a simple admin interface for data entry
3. Using localStorage to persist changes across sessions

### Performance Optimization
For larger patient databases (100+ patients):
1. Implement virtual scrolling for search results
2. Add pagination to tables
3. Lazy load patient notes and results

### Adding Persistence
To make data changes permanent:
1. Add a backend API to save/load patient data
2. Use localStorage API for client-side persistence
3. Implement IndexedDB for larger datasets

## License and Attribution

This simulation system is designed for internal hospital training use. The visual design replicates Cerner PowerChart for educational purposes only.

**Disclaimer:** This is a simulation system and should never be used for actual patient care or to store real patient information.

## Change Log

### Version 1.0 (2025-12-31)
- Initial release
- Patient search functionality
- Core EMR views (Doctor View, Vitals, MAR, Orders, Results, Documentation)
- Orders workflow with signature capability
- Comprehensive logging
- Cerner PowerChart visual replication

## Future Enhancements

Potential features for future versions:
- [ ] Print functionality for clinical notes
- [ ] Export patient data to PDF
- [ ] Medication administration workflow
- [ ] Advanced search with filters
- [ ] User authentication system
- [ ] Multi-user support with roles
- [ ] Audit trail for all actions
- [ ] Custom form builder for notes
- [ ] Integration with actual EMR for read-only access

## Contact

For questions, issues, or suggestions regarding this simulation system, please contact your hospital's IT simulation coordinator.

---

**Remember:** This is a training simulation. Never use real patient data.
