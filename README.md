# PowerChart EMR Simulation (SimCerner)

A high-fidelity clinical EMR simulation modelled after Oracle Cerner PowerChart, built as a Progressive Web App for clinical education and training.

## Features

### Clinical Views
- **Doctor View** — EW Score Table with 3 most recent vitals, NEWS2 score card, clinical notes
- **Managing Deterioration** — NEWS2/Q-ADDS scoring, colour-coded vital signs flowsheet, escalation protocol, trend graph
- **Interactive View (iView)** — Navigator bands, time-columned flowsheet, assessment documentation, structured input forms
- **MAR** — Time-based medication grid, colour-coded administration status, give/hold/refuse workflow
- **Orders** — Autocomplete order entry (70+ lab tests), priority selection, sign workflow
- **Results** — Multi-category lab results (haematology, biochemistry, blood gas, coagulation, urinalysis, cardiac)
- **Fluid Balance** — Intake/output summary cards, detailed fluid balance record
- **Vitals Graph** — Interactive Recharts line graphs with normal range shading
- **Documentation** — Expandable clinical notes viewer
- **Handover Summary** — Auto-generated SBAR summary with print support

### PWA Features
- Offline-capable with service worker (Workbox)
- Installable ("Add to Home Screen")
- Cache-first patient data strategy
- IndexedDB persistence layer
- Offline indicator

### Clinical Scoring
- NEWS2 (National Early Warning Score 2) — full parameter scoring with colour coding
- Q-ADDS (Queensland Adult Deterioration Detection System)
- Escalation protocol recommendations by risk level
- Score trend tracking over time

### Simulation Features
- Simulation clock with play/pause and speed controls (1x, 2x, 5x, 10x)
- Time travel (+/- 15min, +/- 1hr)
- Enhanced allergy banner with severity badges
- Drug-allergy interaction warnings

## Technology Stack

| Concern | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 7 |
| State Management | Zustand |
| Routing | React Router v7 |
| Charting | Recharts |
| PWA | vite-plugin-pwa (Workbox) |
| Persistence | IndexedDB |
| Testing | Vitest + React Testing Library |
| Deployment | Docker (nginx) |
| CI/CD | GitHub Actions |

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open in browser
open http://localhost:5173
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker

```bash
# Build and run with Docker Compose
docker compose up -d

# Or build manually
docker build -t simcerner .
docker run -p 8080:80 simcerner
```

The app will be available at `http://localhost:8080`.

### Testing

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

## Project Structure

```
simcerner/
├── public/
│   ├── patients/              # Patient JSON data files
│   │   ├── patient-list.json  # Patient manifest
│   │   └── jetson-judy.json   # Sample patient
│   ├── icons/                 # PWA icons
│   └── favicon.svg
├── src/
│   ├── main.tsx               # Entry point
│   ├── App.tsx                # Root component + view routing
│   ├── types/                 # TypeScript interfaces
│   │   ├── patient.ts         # Patient data model
│   │   ├── vitals.ts          # Vital signs config
│   │   ├── medications.ts     # Medication types
│   │   ├── news.ts            # NEWS2 scoring types
│   │   └── iview.ts           # iView assessment types
│   ├── stores/                # Zustand state management
│   │   ├── patientStore.ts    # Patient data state
│   │   ├── sessionStore.ts    # UI/session state
│   │   └── clockStore.ts      # Simulation clock
│   ├── services/              # Business logic
│   │   ├── patientLoader.ts   # Patient data loading
│   │   ├── newsCalculator.ts  # NEWS2/Q-ADDS scoring
│   │   ├── alertEngine.ts     # Deterioration alerts
│   │   ├── persistence.ts     # IndexedDB layer
│   │   └── labTests.ts        # Lab test catalogue
│   ├── hooks/                 # React hooks
│   │   ├── usePatient.ts
│   │   ├── useNewsScore.ts
│   │   └── useClock.ts
│   ├── components/
│   │   ├── layout/            # TopNav, PatientBanner, Sidebar, StatusBar
│   │   ├── common/            # DataTable, Autocomplete, AlertDialog, etc.
│   │   ├── search/            # PatientSearch
│   │   ├── doctor-view/       # DoctorView
│   │   ├── deterioration/     # NEWS2 scoring views
│   │   ├── iview/             # Interactive View (iView)
│   │   ├── mar/               # Medication Administration Record
│   │   ├── orders/            # Order entry
│   │   ├── results/           # Lab results
│   │   ├── documentation/     # Clinical notes
│   │   ├── fluid-balance/     # Fluid balance
│   │   └── vitals-graph/      # Vital signs graphs
│   └── styles/                # CSS files
│       ├── global.css
│       ├── cerner-theme.css
│       └── components/
├── Dockerfile                 # Multi-stage production build
├── docker-compose.yml         # Single-command deployment
├── nginx.conf                 # SPA-ready nginx config
├── vite.config.ts             # Vite + PWA configuration
├── vitest.config.ts           # Test configuration
└── tsconfig.json              # TypeScript configuration
```

## Patient Data

Patient data is loaded from JSON files in `public/patients/`. The system supports both flat and hierarchical data formats.

### Adding Patients

1. Create a JSON file in `public/patients/` following the format in `patient-template.json`
2. Add the filename to `public/patients/patient-list.json`
3. The patient will appear in the search

### Default Patient

A default patient (CAMPBELL, NATALIE - MRN PAH599806) is embedded for offline use when external patient files are unavailable.

## NEWS2 Scoring

The app implements the full NHS NEWS2 scoring system:

| Parameter | Score 3 | Score 2 | Score 1 | Score 0 | Score 1 | Score 2 | Score 3 |
|---|---|---|---|---|---|---|---|
| Resp Rate | ≤8 | | 9-11 | 12-20 | | 21-24 | ≥25 |
| SpO₂ Scale 1 | ≤91 | 92-93 | 94-95 | ≥96 | | | |
| Systolic BP | ≤90 | 91-100 | 101-110 | 111-219 | | | ≥220 |
| Heart Rate | ≤40 | | 41-50 | 51-90 | 91-110 | 111-130 | ≥131 |
| Temperature | ≤35.0 | | 35.1-36.0 | 36.1-38.0 | 38.1-39.0 | ≥39.1 | |
| Consciousness | | | | Alert | | | CVPU |

## Security Notes

This is a **simulation tool** for education and training only. It does not connect to real clinical systems or contain real patient data. All patient data is fictional.

## License

Proprietary — for clinical education use only.
