# PowerChart EMR Simulation: Enhancement & PWA Refactor Plan

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Powerchart Feature Research & Enhancement Opportunities](#2-powerchart-feature-research--enhancement-opportunities)
3. [PWA Refactoring Plan](#3-pwa-refactoring-plan)
4. [Prioritised Task List with Dependencies & Critical Path](#4-prioritised-task-list-with-dependencies--critical-path)
5. [Completion Audit (2 Mar 2026)](#5-completion-audit-2-mar-2026)

---

## 1. Current State Assessment

### Architecture
- **Single-file application**: Everything lives in `emr-sim-v2.html` (~2,043 lines)
- **Framework**: React 18 loaded via CDN (`unpkg.com`), with Babel Standalone for in-browser JSX transpilation
- **No build system**: No `package.json`, no bundler (Webpack/Vite), no Node.js dependency
- **No PWA features**: No service worker, no manifest, no offline capability
- **No tests**: No test infrastructure whatsoever
- **No state management**: Local React `useState` only; state resets on page refresh
- **Styling**: All CSS embedded in `<style>` block (~640 lines); uses CSS custom properties for Cerner color scheme
- **Patient data**: Hardcoded fallback patients in JS, with optional loading from `patients/*.json` via fetch

### Existing Views/Components
| Component | Description | Fidelity |
|---|---|---|
| `PatientSearch` | Search by name/MRN | Basic |
| `DoctorView` | EW Score table (3 most recent vitals) + recent notes | Basic |
| `VitalsView` | Tabular vital signs flow sheet | Basic - no NEWS scoring |
| `VitalsGraphView` | Canvas-based sparkline graphs for RR, SpO2, BP, HR | Moderate |
| `FluidBalanceView` | I&O summary cards + detailed table | Moderate |
| `MARView` | Read-only medication list table | Very basic - not a real MAR |
| `OrdersView` | Add orders with autocomplete + sign workflow | Moderate |
| `ResultsView` | Haematology + Biochemistry result tables | Basic |
| `DocumentationView` | Expandable clinical notes | Basic |

### Existing JSON Data Model
Two formats supported (flat legacy + hierarchical new). Key data entities:
- Demographics, Admission info
- Vital signs (temp, HR, RR, BP, SpO2, AVPU)
- Fluid balance (oral/IV intake, urine/other output)
- Medications (name, dose, route, frequency, scheduled times, lastGiven)
- Orders (type, name, status, signed flag)
- Lab results (haematology, biochemistry, blood gas, coagulation, urinalysis, cardiac)
- Clinical notes (type, title, author, datetime, content)

### Key Gaps vs Real Powerchart
1. No NEWS/NEWS2/Q-ADDS score calculation or display
2. No colour-coded deterioration alerting
3. No time-based MAR grid with administration status cells
4. No Interactive View (iView) with navigator bands and flowsheet documentation
5. No medication administration workflow (scan, give, hold, refuse)
6. No escalation protocol display
7. No real-time clock or shift-based views
8. No data input for vitals (read-only)
9. No persistence layer
10. No offline capability

---

## 2. Powerchart Feature Research & Enhancement Opportunities

### 2.1 Deterioration View (Managing Deterioration / NEWS)

#### What Real Powerchart Does
- **NEWS2 Scoring**: Calculates National Early Warning Score from 7 physiological parameters (RR, SpO2, supplemental O2, temperature, systolic BP, heart rate, consciousness level)
- **Colour-coded cells**: Each vital sign cell is colour-coded based on its NEWS2 sub-score (white=0, yellow=1, orange=2, red=3)
- **Aggregate NEWS2 score**: Displayed prominently with clinical risk level (Low, Low-Medium, Medium, High)
- **Escalation protocol**: Automated display of recommended clinical response based on score thresholds
- **Discern Alerts**: Pop-up notifications triggered when NEWS thresholds are exceeded
- **EWS/Sepsis Dashboard (MPage)**: Population-level view showing patients with rising scores, new alerts, and ICU transfers
- **Q-ADDS** (Queensland specific): Queensland Adult Deterioration Detection System - similar to NEWS but with slightly different parameters and thresholds
- **Trend analysis**: Ability to see score trajectory over time

#### Enhancement Opportunities

**E1. NEWS2/Q-ADDS Score Calculator** (High Priority)
- Auto-calculate NEWS2 score from vital sign entries
- Display sub-scores per parameter with colour coding per the NHS NEWS2 colour chart
- Show aggregate score with clinical risk level badge
- Support both NEWS2 and Q-ADDS scoring systems (configurable)

**E2. Colour-Coded Vital Signs Flow Sheet** (High Priority)
- Replace plain table with colour-coded grid matching real Powerchart
- Each cell background reflects severity (white/yellow/orange/red)
- Normal range reference bands visible

**E3. Deterioration Alert Simulation** (Medium Priority)
- Simulate Discern-style pop-up alerts when NEWS2 exceeds thresholds
- Display escalation protocol recommendations inline
- Track alert acknowledgement

**E4. Score Trend Graph** (Medium Priority)
- Dedicated NEWS2/Q-ADDS score trend line over time
- Overlay with vital sign graphs for correlation

**E5. EWS Dashboard View** (Lower Priority)
- Population-level view showing all patients ordered by NEWS2 score
- Colour-coded risk stratification
- Alert count badges

### 2.2 Interactive View (iView)

#### What Real Powerchart Does
- **Navigator panel**: Left-side panel with collapsible "bands" (Med Surg, Respiratory, I&O, Procedures, etc.)
- **Sections within bands**: Each band contains sections (e.g., Med Surg contains Vital Signs, Pain Assessment, Neurological, Skin, etc.)
- **Flowsheet grid**: Time-based columns (like a spreadsheet), with rows for each assessment parameter
- **Documentation by exception**: Click on cells to document; checkbox marks indicate completed sections
- **Time columns**: Configurable intervals (1hr, 2hr, 4hr, shift-based)
- **Sign/Refresh/Customise toolbar**: Toolbar buttons for signing documentation, refreshing data, showing/hiding empty rows
- **Assessment forms**: Clicking a cell opens structured input forms for specific assessments
- **Auto-population**: Some values auto-populate from MAR, devices, etc.

#### Enhancement Opportunities

**E6. iView Navigator Band Structure** (High Priority)
- Implement left-side navigator with collapsible bands
- Default bands: Vital Signs, Neurological, Respiratory, Cardiovascular, Pain Assessment, Skin/Wounds, I&O
- Checkmark indicators for documented sections

**E7. Flowsheet Grid with Time Columns** (High Priority)
- Replace flat tables with proper time-columned flowsheet
- Configurable time interval display (1hr, 2hr, 4hr, 8hr, 12hr)
- Current-time column highlighted in yellow
- Empty row toggle (show/hide)

**E8. Assessment Documentation Input** (Medium Priority)
- Allow users to click cells and enter assessment data
- Structured input forms for each assessment type (dropdown selections, free text, checkboxes)
- Data validation on entry

**E9. iView Toolbar** (Medium Priority)
- Sign button to finalise documentation
- Refresh button
- Time range selector
- Show/Hide empty rows toggle
- Customise view (add/remove bands)

**E10. Shift-Based Summaries** (Lower Priority)
- Day/Night shift aggregation
- Shift handover summary generation
- Running totals by shift

### 2.3 Medication Administration Record (MAR)

#### What Real Powerchart Does
- **Time-based grid**: Medications listed in rows, time slots in columns (reverse chronological, current time highlighted)
- **Colour-coded cells**:
  - Light blue = Pending/Due
  - Yellow highlight = Current time column
  - Red background + icon = Overdue
  - Grey = Given/Completed
  - Dithered/greyed = Future (not yet due)
- **Therapeutic class grouping**: Medications grouped by Multum therapeutic class via navigator band
- **Administration workflow**: Click cell to open administration wizard (scan barcode, document given/held/refused/not given)
- **Status icons**: Specific icons for each status (given checkmark, held hand, refused X, etc.)
- **PRN tracking**: Separate section or visual distinction for PRN medications
- **Sliding scale support**: Display of insulin sliding scale protocols
- **Infusion tracking**: Running infusion rates and cumulative volumes

#### Enhancement Opportunities

**E11. Time-Based MAR Grid** (High Priority)
- Replace flat medication table with proper time-columned MAR grid
- Generate time columns based on medication schedules
- Colour-code cells based on administration status (pending/due/overdue/given/future)
- Current time column highlighted

**E12. Medication Administration Workflow** (High Priority)
- Click on a pending cell to open administration dialog
- Options: Give, Hold, Refuse, Not Given (with reason selection)
- Record administering nurse and timestamp
- Update cell status and colour after action

**E13. MAR Status Icons & Indicators** (Medium Priority)
- Implement standard MAR icons (checkmark for given, X for refused, hand for held, clock for pending)
- Overdue indicator with elapsed time
- PRN medications visually distinguished

**E14. Therapeutic Class Grouping** (Medium Priority)
- Group medications by class in navigator
- Allow filtering by class
- Separate sections for scheduled vs PRN vs infusions

**E15. Administration History** (Lower Priority)
- View past administration details for each medication
- Track who gave what and when
- Support notes/comments on each administration

### 2.4 Cross-Cutting Enhancements

**E16. Vital Signs Data Entry** (High Priority)
- Allow users to document new vital sign sets (currently read-only)
- Auto-calculate NEWS2/Q-ADDS on entry
- Trigger alerts if thresholds exceeded

**E17. Real-Time Clock & Shift Awareness** (Medium Priority)
- Display current simulation time
- Allow "time travel" for training scenarios (advance/rewind simulation clock)
- Shift-based views aligned to clock

**E18. Allergy Alert Banner Enhancement** (Medium Priority)
- Prominent colour-coded allergy display in patient banner
- Drug-allergy interaction warnings when administering medications

**E19. Handover/SBAR Summary** (Lower Priority)
- Auto-generated SBAR (Situation, Background, Assessment, Recommendation) summary
- Pulls from latest vitals, active orders, recent notes, and medication status

**E20. Print/Export Views** (Lower Priority)
- Print-friendly layouts for each view
- PDF export of patient summary

---

## 3. PWA Refactoring Plan

### 3.1 Framework Selection: React + Vite

**Rationale**: The existing code is already React. Vite provides:
- Fast dev server with HMR
- Optimised production builds
- Built-in PWA plugin (`vite-plugin-pwa`)
- TypeScript support out of the box
- Simpler configuration than Webpack

Choosing React over Vue or Ionic avoids rewriting existing component logic. Ionic adds unnecessary native-mobile abstraction for what is fundamentally a desktop-first clinical tool.

### 3.2 Target Architecture

```
simcerner/
├── public/
│   ├── manifest.json            # PWA manifest
│   ├── favicon.ico
│   ├── icons/                   # PWA icons (192x192, 512x512)
│   └── patients/                # Patient JSON files (served statically)
│       ├── patient-list.json
│       ├── campbell-natalie.json
│       └── jetson-judy.json
├── src/
│   ├── main.tsx                 # Entry point
│   ├── App.tsx                  # Root component + routing
│   ├── types/
│   │   ├── patient.ts           # Patient data interfaces
│   │   ├── vitals.ts            # Vital signs types
│   │   ├── medications.ts       # Medication types
│   │   └── news.ts              # NEWS2 scoring types
│   ├── stores/
│   │   ├── patientStore.ts      # Patient data state (Zustand)
│   │   ├── sessionStore.ts      # Session/auth state
│   │   └── clockStore.ts        # Simulation clock state
│   ├── services/
│   │   ├── patientLoader.ts     # Patient data loading/caching
│   │   ├── newsCalculator.ts    # NEWS2/Q-ADDS score calculator
│   │   ├── alertEngine.ts       # Deterioration alert logic
│   │   └── persistence.ts       # IndexedDB persistence layer
│   ├── hooks/
│   │   ├── usePatient.ts        # Patient data hook
│   │   ├── useNewsScore.ts      # NEWS2 calculation hook
│   │   └── useClock.ts          # Simulation clock hook
│   ├── components/
│   │   ├── layout/
│   │   │   ├── TopNav.tsx
│   │   │   ├── PatientBanner.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── StatusBar.tsx
│   │   ├── common/
│   │   │   ├── DataTable.tsx
│   │   │   ├── FlowsheetGrid.tsx
│   │   │   ├── Autocomplete.tsx
│   │   │   ├── AlertDialog.tsx
│   │   │   └── TimeColumnHeader.tsx
│   │   ├── search/
│   │   │   └── PatientSearch.tsx
│   │   ├── doctor-view/
│   │   │   └── DoctorView.tsx
│   │   ├── deterioration/
│   │   │   ├── DeteriorationView.tsx
│   │   │   ├── NewsScoreCard.tsx
│   │   │   ├── VitalSignsFlowsheet.tsx
│   │   │   ├── EscalationProtocol.tsx
│   │   │   └── ScoreTrendGraph.tsx
│   │   ├── iview/
│   │   │   ├── InteractiveView.tsx
│   │   │   ├── NavigatorPanel.tsx
│   │   │   ├── FlowsheetSection.tsx
│   │   │   ├── AssessmentForm.tsx
│   │   │   └── IViewToolbar.tsx
│   │   ├── mar/
│   │   │   ├── MARView.tsx
│   │   │   ├── MARGrid.tsx
│   │   │   ├── MARCell.tsx
│   │   │   ├── AdminDialog.tsx
│   │   │   └── TherapeuticClassNav.tsx
│   │   ├── orders/
│   │   │   └── OrdersView.tsx
│   │   ├── results/
│   │   │   └── ResultsView.tsx
│   │   ├── documentation/
│   │   │   └── DocumentationView.tsx
│   │   ├── fluid-balance/
│   │   │   └── FluidBalanceView.tsx
│   │   └── vitals-graph/
│   │       └── VitalsGraphView.tsx
│   └── styles/
│       ├── global.css            # CSS custom properties + resets
│       ├── cerner-theme.css      # Cerner colour scheme tokens
│       └── components/           # Component-specific CSS modules
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── vitest.config.ts              # Test configuration
```

### 3.3 Technology Choices

| Concern | Choice | Rationale |
|---|---|---|
| **Framework** | React 18 + TypeScript | Existing code is React; TS adds safety for clinical data |
| **Build Tool** | Vite 6 | Fast, simple, excellent PWA plugin |
| **State Management** | Zustand | Minimal boilerplate, works well with React; simpler than Redux |
| **Routing** | React Router v7 | Standard React routing, supports lazy loading |
| **Styling** | CSS Modules + CSS custom properties | Keep existing CSS approach, add scoping |
| **PWA** | vite-plugin-pwa (Workbox) | Automatic service worker generation, precaching |
| **Persistence** | IndexedDB via idb | Offline patient data storage, session persistence |
| **Charting** | Recharts or lightweight Canvas | Replace hand-rolled canvas; Recharts is React-native |
| **Testing** | Vitest + React Testing Library | Fast, Vite-native, good component testing |
| **Linting** | ESLint + Prettier | Code consistency |

### 3.4 PWA Configuration

**manifest.json**:
- `name`: "PowerChart EMR Simulation"
- `short_name`: "PowerChart Sim"
- `display`: "standalone"
- `orientation`: "landscape" (clinical workstations are typically landscape)
- `theme_color`: "#004578" (Cerner dark blue)
- `background_color`: "#ffffff"
- Icons at 192x192 and 512x512

**Service Worker Strategy** (via Workbox):
- **App shell**: Precache all HTML/JS/CSS assets for instant load
- **Patient data**: Cache-first strategy with network fallback for patient JSON files
- **Runtime caching**: StaleWhileRevalidate for CDN resources (if any remain)
- **Offline indicator**: Visual indicator when operating offline

**IndexedDB Storage**:
- Patient records cached for offline access
- Session actions (orders placed, vitals entered, meds administered) stored locally
- Sync queue for when connectivity is available (future server integration)

### 3.5 Migration Strategy

The migration follows a "strangler fig" pattern - progressively extracting from the monolith:

1. **Phase 1**: Scaffold Vite project, copy CSS, establish TypeScript interfaces
2. **Phase 2**: Extract and migrate components one by one (layout first, then each view)
3. **Phase 3**: Add state management and persistence
4. **Phase 4**: Add PWA configuration
5. **Phase 5**: Add new features on the new architecture
6. **Phase 6**: Remove old `emr-sim-v2.html` once parity achieved

---

## 4. Prioritised Task List with Dependencies & Critical Path

### Legend
- **Priority**: P0 (Critical/Blocking), P1 (High), P2 (Medium), P3 (Lower)
- **Dependencies**: Tasks that must complete before this task can start
- **Critical Path**: Marked with `[CP]` - delays here delay the entire project

### Phase 0: Foundation (PWA Scaffold) `[CP]`

| # | Task | Priority | Dependencies | Est. Complexity |
|---|---|---|---|---|
| 0.1 | `[CP]` Initialise Vite + React + TypeScript project with `package.json` | P0 | None | Low |
| 0.2 | `[CP]` Define TypeScript interfaces for all data models (`Patient`, `VitalSign`, `Medication`, `Order`, `LabResult`, `ClinicalNote`, `FluidBalance`) | P0 | 0.1 | Medium |
| 0.3 | `[CP]` Extract CSS into modular files (`global.css`, `cerner-theme.css`, component CSS modules) | P0 | 0.1 | Medium |
| 0.4 | `[CP]` Set up React Router with route definitions for all views | P0 | 0.1 | Low |
| 0.5 | `[CP]` Set up Zustand stores (`patientStore`, `sessionStore`, `clockStore`) | P0 | 0.2 | Medium |
| 0.6 | Configure ESLint + Prettier | P1 | 0.1 | Low |
| 0.7 | Set up Vitest + React Testing Library | P1 | 0.1 | Low |
| 0.8 | Move patient JSON files to `public/patients/` and migrate `PatientDataLoader` to `services/patientLoader.ts` | P0 | 0.2, 0.5 | Medium |

### Phase 1: Layout & Core Component Migration `[CP]`

| # | Task | Priority | Dependencies | Est. Complexity |
|---|---|---|---|---|
| 1.1 | `[CP]` Migrate `TopNav` component to TSX | P0 | 0.3, 0.4 | Low |
| 1.2 | `[CP]` Migrate `PatientBanner` component to TSX | P0 | 0.2, 0.3 | Low |
| 1.3 | `[CP]` Migrate `Sidebar` component to TSX with route-based active state | P0 | 0.4 | Low |
| 1.4 | `[CP]` Migrate `StatusBar` component to TSX | P0 | 0.3 | Low |
| 1.5 | `[CP]` Migrate `PatientSearch` component to TSX | P0 | 0.5, 0.8 | Medium |
| 1.6 | `[CP]` Create `App.tsx` root component assembling layout | P0 | 1.1-1.5 | Medium |
| 1.7 | Build reusable `DataTable` component | P1 | 0.3 | Low |
| 1.8 | Build reusable `FlowsheetGrid` component (time-columned grid) | P1 | 0.3 | High |
| 1.9 | Migrate `Autocomplete` component to TSX | P1 | 0.3 | Low |

### Phase 2: View Migration (Existing Features) `[CP]`

| # | Task | Priority | Dependencies | Est. Complexity |
|---|---|---|---|---|
| 2.1 | `[CP]` Migrate `DoctorView` to TSX | P0 | 1.6, 1.7 | Medium |
| 2.2 | `[CP]` Migrate `VitalsView` to TSX | P0 | 1.6, 1.7 | Low |
| 2.3 | Migrate `VitalsGraphView` to TSX (replace canvas with Recharts) | P1 | 1.6 | Medium |
| 2.4 | `[CP]` Migrate `MARView` to TSX | P0 | 1.6, 1.7 | Low |
| 2.5 | `[CP]` Migrate `OrdersView` to TSX | P0 | 1.6, 1.9 | Medium |
| 2.6 | Migrate `ResultsView` to TSX | P1 | 1.6, 1.7 | Low |
| 2.7 | Migrate `DocumentationView` to TSX | P1 | 1.6 | Low |
| 2.8 | Migrate `FluidBalanceView` to TSX | P1 | 1.6, 1.7 | Low |
| 2.9 | Verify feature parity with `emr-sim-v2.html` across all views | P0 | 2.1-2.8 | Medium |

### Phase 3: PWA Configuration `[CP]`

| # | Task | Priority | Dependencies | Est. Complexity |
|---|---|---|---|---|
| 3.1 | `[CP]` Configure `vite-plugin-pwa` with manifest and icons | P0 | 0.1 | Low |
| 3.2 | `[CP]` Implement Workbox service worker with precaching strategy | P0 | 3.1, 2.9 | Medium |
| 3.3 | `[CP]` Implement IndexedDB persistence layer for patient data | P0 | 0.5 | High |
| 3.4 | Add offline indicator UI component | P1 | 3.2 | Low |
| 3.5 | Implement cache-first loading for patient JSON files | P1 | 3.2, 3.3 | Medium |
| 3.6 | Add install prompt / "Add to Home Screen" UI | P2 | 3.1 | Low |
| 3.7 | Test offline functionality end-to-end | P0 | 3.2-3.5 | Medium |

### Phase 4: Deterioration View Enhancements `[HIGH VALUE]`

| # | Task | Priority | Dependencies | Est. Complexity |
|---|---|---|---|---|
| 4.1 | Implement NEWS2 score calculation service (`newsCalculator.ts`) | P0 | 0.2 | Medium |
| 4.2 | Implement Q-ADDS score calculation (alternate algorithm) | P1 | 4.1 | Medium |
| 4.3 | Build `NewsScoreCard` component (aggregate score + risk level badge) | P0 | 4.1 | Medium |
| 4.4 | Build colour-coded `VitalSignsFlowsheet` with per-cell NEWS2 sub-scores | P0 | 1.8, 4.1 | High |
| 4.5 | Build `EscalationProtocol` component (recommended actions per score) | P1 | 4.1 | Medium |
| 4.6 | Build `ScoreTrendGraph` for NEWS2 score over time | P2 | 4.1, 2.3 | Medium |
| 4.7 | Implement deterioration alert engine (`alertEngine.ts`) | P1 | 4.1, 0.5 | High |
| 4.8 | Build `AlertDialog` component for simulated Discern alerts | P1 | 4.7 | Medium |
| 4.9 | Update `DeteriorationView` to compose all sub-components | P0 | 4.3, 4.4, 4.5 | Medium |
| 4.10 | Extend patient JSON schema with `supplementalO2` and `consciousnessLevel` fields for full NEWS2 | P1 | 0.2 | Low |
| 4.11 | Build EWS Dashboard (population-level view) | P3 | 4.1, 4.7 | High |

### Phase 5: Interactive View (iView) Implementation `[HIGH VALUE]`

| # | Task | Priority | Dependencies | Est. Complexity |
|---|---|---|---|---|
| 5.1 | Design iView data model and extend TypeScript types (`Assessment`, `Band`, `Section`) | P0 | 0.2 | Medium |
| 5.2 | Build `NavigatorPanel` with collapsible bands and section checkmarks | P0 | 5.1 | High |
| 5.3 | Build `FlowsheetSection` (time-columned rows for a given section) | P0 | 1.8, 5.1 | High |
| 5.4 | Build `IViewToolbar` (Sign, Refresh, Time Range, Show/Hide Empty) | P1 | 5.3 | Medium |
| 5.5 | Build `AssessmentForm` - structured input for cell-click documentation | P1 | 5.3 | High |
| 5.6 | Implement default band configurations (Med Surg, Respiratory, Neuro, CVS, Pain, Skin, I&O) | P1 | 5.2 | Medium |
| 5.7 | Wire vital signs entry through iView (E16) with NEWS2 auto-calculation | P0 | 4.1, 5.5 | High |
| 5.8 | Implement shift-based aggregation and totals | P2 | 5.3 | Medium |
| 5.9 | Assemble `InteractiveView` composing all sub-components | P0 | 5.2-5.7 | Medium |
| 5.10 | Implement band customisation (add/remove bands for a patient) | P3 | 5.2, 5.6 | Medium |

### Phase 6: MAR Enhancements `[HIGH VALUE]`

| # | Task | Priority | Dependencies | Est. Complexity |
|---|---|---|---|---|
| 6.1 | Design MAR time grid data model | P0 | 0.2 | Medium |
| 6.2 | Build `MARGrid` - time-columned medication grid with colour-coded cells | P0 | 1.8, 6.1 | High |
| 6.3 | Build `MARCell` - individual cell with status icon and colour | P0 | 6.2 | Medium |
| 6.4 | Implement MAR colour logic (pending=blue, current=yellow, overdue=red, given=grey, future=dithered) | P0 | 6.3 | Medium |
| 6.5 | Build `AdminDialog` - medication administration workflow (Give/Hold/Refuse/Not Given) | P0 | 6.3 | High |
| 6.6 | Build `TherapeuticClassNav` - medication grouping navigator | P2 | 6.2 | Medium |
| 6.7 | Implement PRN medication section with distinct visual treatment | P1 | 6.2 | Medium |
| 6.8 | Implement administration history view per medication | P2 | 6.5 | Medium |
| 6.9 | Assemble enhanced `MARView` composing all sub-components | P0 | 6.2-6.5 | Medium |
| 6.10 | Implement overdue medication alerting | P1 | 6.4, 4.7 | Medium |

### Phase 7: Cross-Cutting Enhancements

| # | Task | Priority | Dependencies | Est. Complexity |
|---|---|---|---|---|
| 7.1 | Implement simulation clock with time-travel controls | P1 | 0.5 | Medium |
| 7.2 | Enhanced allergy alert banner with drug interaction warnings | P2 | 1.2 | Medium |
| 7.3 | SBAR handover summary auto-generation | P2 | 2.1, 4.1, 6.9 | High |
| 7.4 | Print/PDF export for all views | P3 | 2.9 | Medium |
| 7.5 | Write unit tests for NEWS2 calculator | P1 | 4.1, 0.7 | Medium |
| 7.6 | Write unit tests for MAR time grid logic | P1 | 6.1, 0.7 | Medium |
| 7.7 | Write integration tests for key workflows | P2 | 2.9, 0.7 | High |
| 7.8 | Implement session action logging to IndexedDB | P2 | 3.3 | Medium |
| 7.9 | Create scenario runner (pre-scripted deterioration events for training) | P3 | 7.1, 4.7 | High |

### Phase 8: Polish & Deployment

| # | Task | Priority | Dependencies | Est. Complexity |
|---|---|---|---|---|
| 8.1 | Responsive layout adjustments (minimum 1024px width) | P2 | 2.9 | Medium |
| 8.2 | Accessibility audit (ARIA labels, keyboard navigation, colour contrast) | P2 | 2.9 | Medium |
| 8.3 | Performance optimisation (lazy loading, code splitting per route) | P2 | 2.9 | Medium |
| 8.4 | Docker containerisation (nginx serving built PWA) | P1 | 2.9 | Low |
| 8.5 | CI/CD pipeline (build + test + deploy) | P2 | 8.4 | Medium |
| 8.6 | Documentation update (README, deployment guide, contributing guide) | P1 | 2.9 | Medium |
| 8.7 | Remove legacy `emr-sim-v2.html` | P1 | 2.9, 3.7 | Low |

---

## Critical Path Diagram

```
Phase 0 (Foundation)
  0.1 → 0.2 → 0.5 → 0.8
  0.1 → 0.3
  0.1 → 0.4
         ↓
Phase 1 (Layout Migration)
  0.3 + 0.4 → 1.1-1.5 → 1.6
  0.3 → 1.8 (FlowsheetGrid - reused by Phases 4, 5, 6)
              ↓
Phase 2 (View Migration)
  1.6 → 2.1-2.8 → 2.9 (Feature Parity Checkpoint)
                         ↓
Phase 3 (PWA)            ├→ 3.1 → 3.2 → 3.5 → 3.7
                         │
              ↓          ↓
Phase 4 (Deterioration) ←── can start in parallel with Phase 3
  4.1 → 4.3 → 4.9
  4.1 → 4.4 → 4.9
  4.1 → 4.5 → 4.9
              ↓
Phase 5 (iView) ←── depends on 1.8 (FlowsheetGrid) + 4.1 (NEWS calc)
  5.1 → 5.2 → 5.9
  5.1 → 5.3 → 5.5 → 5.7 → 5.9
              ↓
Phase 6 (MAR) ←── depends on 1.8 (FlowsheetGrid)
  6.1 → 6.2 → 6.3 → 6.4 → 6.9
              6.3 → 6.5 → 6.9
              ↓
Phase 7 (Cross-Cutting) ←── parallel with Phases 4-6
              ↓
Phase 8 (Polish) ←── after all features
```

### Critical Path (Longest Dependency Chain)

**0.1 → 0.2 → 0.5 → 0.8 → 1.5 → 1.6 → 2.1-2.9 → 5.1 → 5.3 → 5.5 → 5.7 → 5.9**

This path runs through: foundation setup → data models → state management → patient loader → layout assembly → view migration → iView implementation (the most complex new feature).

### Parallelisation Opportunities

- **Phase 0**: Tasks 0.3 (CSS), 0.4 (routing), 0.6 (lint), 0.7 (tests) can all run in parallel after 0.1
- **Phase 1**: 1.1-1.5 can all run in parallel once 0.3 and 0.4 are done; 1.7, 1.8, 1.9 can run in parallel
- **Phase 2**: 2.1-2.8 can all run in parallel once 1.6 is done
- **Phases 4, 5, 6**: Can begin in parallel once their shared dependencies (1.8, 0.2) are satisfied
  - Phase 4 (Deterioration) has no dependency on Phases 5 or 6
  - Phase 6 (MAR) has no dependency on Phases 4 or 5
  - Phase 5 (iView) depends on 4.1 (NEWS calculator) for vital sign entry with auto-scoring
- **Phase 7**: Test writing (7.5, 7.6) can happen as soon as the services they test exist
- **Phase 3 (PWA)**: 3.1 can start any time after 0.1; 3.2-3.7 need feature parity (2.9) before meaningful testing

---

## Research Sources

### Deterioration / NEWS
- [CST Cerner Help - National Early Warning Score (NEWS)](https://cstcernerhelp.healthcarebc.ca/Workflows/NEWS/National_Early_Warning_Score_(NEWS).htm)
- [CST Cerner Help - EWS/Sepsis Dashboard Overview](https://cstcernerhelp.healthcarebc.ca/Applications/PowerChart/EWS_Sepsis_Dashboard/EWS-Sepsis_Dashboard_Overview.htm)
- [NHS Royal College of Physicians - NEWS2](https://www.rcp.ac.uk/improving-care/resources/national-early-warning-score-news-2/)
- [Emory School of Medicine - Early Warning and Decompensation / MEWS](https://med.emory.edu/clinical-experience/advanced-patient-care/rads2/clinical-decision-support/mews.html)
- [University of Missouri / Healthcare IT News - Cerner Sepsis IT](https://www.healthcareitnews.com/news/university-missouri-health-system-saves-lives-cerner-sepsis-it)
- [MKUH NHS - Discern Notification](https://digital.mkuh.nhs.uk/wp-content/uploads/2019/01/Ref-115-Discern-Notification.pdf)
- [MDCalc - Modified Early Warning Score (MEWS)](https://www.mdcalc.com/calc/1875/modified-early-warning-score-mews-clinical-deterioration)

### Interactive View (iView)
- [CST Cerner Help - Document Intake and Output (I&O)](https://cstcernerhelp.healthcarebc.ca/Patient_Chart/iView/Document_Intake_and_Output_(I_and_O).htm)
- [CST Cerner Help - Customize IView Navigator Bands](https://cstcernerhelp.healthcarebc.ca/Patient_Chart/iView/Customize/Customize_IView_Navigator_Bands.htm)
- [Cerner Wiki - Navigating iView (Emory Healthcare)](https://wiki.cerner.com/display/EMRYGA/Navigating+iView)
- [Monash Health - Interactive View QRG (PDF)](https://emrmonashhealth.org/wp-content/uploads/2021/09/Interactive-View-Customisation-and-Documentation-QRG-v4-1.pdf)
- [Health PEI - iView Training Guide (PDF)](https://src.healthpei.ca/sites/src.healthpei.ca/files/CIS/iView_Training_Guide.pdf)
- [PowerChart LTC Training Manual (PDF)](http://tccdocs.tcc4care.com/images/PowerChartTraining.pdf)

### Medication Administration Record (MAR)
- [CST Cerner Help - MAR Overview](https://cstcernerhelp.healthcarebc.ca/Patient_Chart/MAR/Medication_Administration_Record_(MAR)_Overview.htm)
- [CST Cerner Help - Statuses on the MAR](https://cstcernerhelp.healthcarebc.ca/Patient_Chart/MAR/Statuses_on_the_MAR.htm)
- [CST Cerner Help - MAR Icons](https://cstcernerhelp.healthcarebc.ca/Patient_Chart/MAR/Medication_Administration_Record_Icons.htm)
- [CST Cerner Help - MAR Summary Overview](https://cstcernerhelp.healthcarebc.ca/Patient_Chart/Medications/MAR_Summary/MAR_Summary_Overview.htm)
- [Cerner Wiki - Navigating the Electronic MAR (Island Health)](https://wiki.cerner.com/pages/releaseview.action?pageId=2830875563)

### General Powerchart
- [SoftwareFinder - How To Use Cerner Charting](https://softwarefinder.com/resources/how-to-use-cerner-charting)
- [Folio3 - Cerner PowerChart Overview](https://digitalhealth.folio3.com/blog/all-about-cerner-powerchart/)
- [AdventHealth - Cerner Computer Documentation Training (PDF)](https://www.adventhealth.com/sites/default/files/assets/ah_waterman-cerner_computer_documentation_student_training_pp_2020_1_.pdf)
- [IU Basic PowerChart Reference Guide (PDF)](https://ocr.iu.edu/wp-content/uploads/2019/06/PC%E2%80%93Basic-PowerChart-Reference-Guide-v2-01-31-17.pdf)

---

## 5. Completion Audit (2 Mar 2026)

### Audit Summary

The codebase remains a **monolithic single-file HTML application** (`emr-sim-v2.html`, 2,042 lines). No PWA scaffold, build system, TypeScript, or test infrastructure has been introduced. The application uses React 18 via CDN with Babel in-browser JSX transpilation.

**Overall Progress: 0 of 86 tasks complete. All tasks remain NOT STARTED.**

The existing `emr-sim-v2.html` contains the **baseline components** that the plan targets for migration. Below is a line-by-line audit of what exists in the codebase today, mapped against every task in the backlog.

---

### Existing Baseline Inventory (in `emr-sim-v2.html`)

| Component | Lines | What It Does | Fidelity vs Real PowerChart |
|---|---|---|---|
| CSS styles | 10-640 | Embedded `<style>` block with Cerner color scheme, layout, tables, forms | Basic Cerner look-and-feel |
| `Logger` | 651-679 | Console logging utility with 1000-entry buffer | Debug utility only |
| `LAB_TESTS` | 684-719 | 22 predefined lab test entries for autocomplete | Static lookup table |
| `PatientDataLoader` | 724-1118 | Class: loads patient JSON from `patients/` dir or falls back to 1 hardcoded patient (CAMPBELL, NATALIE) | Functional but limited |
| `normalizePatientData()` | 792-1004 | Transforms new hierarchical JSON format to flat format | Handles 2 formats |
| `Autocomplete` | 1126-1218 | Reusable autocomplete input with keyboard navigation | Moderate |
| `VitalSignGraph` | 1223-1303 | Canvas-based sparkline graph for a single vital parameter | Basic (no axis labels) |
| `EMRSimulation` | 1308-1526 | Root app component: state management, patient loading, order workflow, view routing | Main orchestrator |
| `TopNav` | 1533-1546 | Top navigation bar with menu labels (no dropdowns, no actions except "Patient") | Placeholder-level |
| `PatientBanner` | 1548-1599 | Patient demographics banner (name, MRN, DOB, allergies, location, attending) | Moderate |
| `Sidebar` | 1601-1637 | Left navigation with 8 menu items, active state highlighting | Basic |
| `DoctorView` | 1640-1702 | EW Score table (3 most recent vitals in grid) + expandable recent notes | Basic |
| `VitalsView` | 1705-1737 | Plain HTML table of all vital signs - no scoring, no color coding | Very basic |
| `VitalsGraphView` | 1739-1766 | 4 canvas graphs (RR, SpO2, SBP, HR) with normal-range shading | Moderate |
| `FluidBalanceView` | 1768-1833 | Summary cards (intake/output/balance) + detailed table | Moderate |
| `MARView` | 1835-1865 | Simple flat table (name, dose, route, frequency, last given) - no time grid | Very basic |
| `OrdersView` | 1867-1935 | Add order via autocomplete + priority selector; current orders table with sign button | Moderate |
| `ResultsView` | 1937-1994 | Haematology + Biochemistry result tables with flag highlighting | Basic |
| `DocumentationView` | 1996-2024 | Expandable/collapsible clinical notes list | Basic |
| `StatusBar` | 2026-2033 | Bottom bar with hardcoded location/time + "Training Mode" label | Minimal |

### Data Files

| File | Status | Notes |
|---|---|---|
| `emr-sim-v2.html` | Exists (2,042 lines) | Monolithic single-file app |
| `jetson-judy.json` | Exists (sample patient) | RBWH hyperkalemia scenario with 4 vitals, 6 meds, 4 orders, 3 lab categories, 3 notes |
| `patient-template.json` | Exists (annotated template) | Contains 3 example patients |
| `patients/` directory | **Does not exist** | No patient manifest or external patient files deployed |
| `package.json` | **Does not exist** | No Node.js project |
| `tsconfig.json` | **Does not exist** | No TypeScript |
| `vite.config.ts` | **Does not exist** | No Vite |
| `manifest.json` | **Does not exist** | No PWA manifest |
| `src/` directory | **Does not exist** | No modular source tree |

---

### Phase 0: Foundation (PWA Scaffold) — Status: NOT STARTED (0/8)

| # | Task | Status | Evidence |
|---|---|---|---|
| 0.1 | Initialise Vite + React + TypeScript project | NOT STARTED | No `package.json`, no `node_modules/`, no `vite.config.ts` |
| 0.2 | Define TypeScript interfaces for all data models | NOT STARTED | No `src/types/` directory. Data shapes are implicit in JS objects |
| 0.3 | Extract CSS into modular files | NOT STARTED | All 640 lines of CSS remain in `<style>` block inside HTML |
| 0.4 | Set up React Router with route definitions | NOT STARTED | Routing is via `useState('search')` with conditional rendering |
| 0.5 | Set up Zustand stores | NOT STARTED | State is `useState` hooks in `EMRSimulation` component |
| 0.6 | Configure ESLint + Prettier | NOT STARTED | No `.eslintrc`, no `.prettierrc` |
| 0.7 | Set up Vitest + React Testing Library | NOT STARTED | No test files, no test config |
| 0.8 | Migrate PatientDataLoader to service + move JSONs | NOT STARTED | `PatientDataLoader` is inline class in HTML. `patients/` dir doesn't exist |

### Phase 1: Layout & Core Component Migration — Status: NOT STARTED (0/9)

| # | Task | Status | Evidence |
|---|---|---|---|
| 1.1 | Migrate `TopNav` to TSX | NOT STARTED | `TopNav` exists as inline function (lines 1533-1546) — needs extraction |
| 1.2 | Migrate `PatientBanner` to TSX | NOT STARTED | `PatientBanner` exists inline (lines 1548-1599) — needs extraction |
| 1.3 | Migrate `Sidebar` to TSX with route-based active state | NOT STARTED | `Sidebar` exists inline (lines 1601-1637) — uses prop-based active, not router |
| 1.4 | Migrate `StatusBar` to TSX | NOT STARTED | `StatusBar` exists inline (lines 2026-2033) — needs extraction |
| 1.5 | Migrate `PatientSearch` to TSX | NOT STARTED | Search is embedded in `EMRSimulation` render (lines 1446-1482) — not a separate component |
| 1.6 | Create `App.tsx` root component | NOT STARTED | `EMRSimulation` function (lines 1308-1526) serves this role but is not modular |
| 1.7 | Build reusable `DataTable` component | NOT STARTED | Tables are inline JSX in each view (no abstraction) |
| 1.8 | Build reusable `FlowsheetGrid` component | NOT STARTED | No time-columned grid component exists. `chart-grid` CSS class exists but is only used for DoctorView EW Score |
| 1.9 | Migrate `Autocomplete` to TSX | NOT STARTED | `Autocomplete` exists inline (lines 1126-1218) — needs extraction + typing |

### Phase 2: View Migration (Existing Features) — Status: NOT STARTED (0/9)

| # | Task | Status | Evidence |
|---|---|---|---|
| 2.1 | Migrate `DoctorView` to TSX | NOT STARTED | Exists inline (lines 1640-1702) |
| 2.2 | Migrate `VitalsView` to TSX | NOT STARTED | Exists inline (lines 1705-1737) |
| 2.3 | Migrate `VitalsGraphView` to TSX (replace canvas with Recharts) | NOT STARTED | Exists as canvas-based inline (lines 1739-1766 + `VitalSignGraph` 1223-1303) |
| 2.4 | Migrate `MARView` to TSX | NOT STARTED | Exists inline (lines 1835-1865) |
| 2.5 | Migrate `OrdersView` to TSX | NOT STARTED | Exists inline (lines 1867-1935) |
| 2.6 | Migrate `ResultsView` to TSX | NOT STARTED | Exists inline (lines 1937-1994) |
| 2.7 | Migrate `DocumentationView` to TSX | NOT STARTED | Exists inline (lines 1996-2024) |
| 2.8 | Migrate `FluidBalanceView` to TSX | NOT STARTED | Exists inline (lines 1768-1833) |
| 2.9 | Verify feature parity across all views | NOT STARTED | Depends on 2.1-2.8 |

### Phase 3: PWA Configuration — Status: NOT STARTED (0/7)

| # | Task | Status | Evidence |
|---|---|---|---|
| 3.1 | Configure `vite-plugin-pwa` with manifest and icons | NOT STARTED | No manifest, no icons, no Vite |
| 3.2 | Implement Workbox service worker | NOT STARTED | No service worker |
| 3.3 | Implement IndexedDB persistence layer | NOT STARTED | No persistence; state resets on refresh |
| 3.4 | Add offline indicator UI component | NOT STARTED | No offline detection |
| 3.5 | Implement cache-first loading for patient JSON | NOT STARTED | Fetch-only loading with fallback to hardcoded data |
| 3.6 | Add install prompt / "Add to Home Screen" UI | NOT STARTED | No PWA |
| 3.7 | Test offline functionality end-to-end | NOT STARTED | No offline capability |

### Phase 4: Deterioration View Enhancements — Status: NOT STARTED (0/11)

| # | Task | Status | Evidence |
|---|---|---|---|
| 4.1 | Implement NEWS2 score calculation service | NOT STARTED | No score calculation. `DoctorView` shows raw vitals only |
| 4.2 | Implement Q-ADDS score calculation | NOT STARTED | `VitalsGraphView` header says "Adult Q-ADDS" but no actual scoring |
| 4.3 | Build `NewsScoreCard` component | NOT STARTED | No aggregate score display |
| 4.4 | Build colour-coded `VitalSignsFlowsheet` | NOT STARTED | `VitalsView` is a plain white table — no cell colouring by severity |
| 4.5 | Build `EscalationProtocol` component | NOT STARTED | No escalation protocol display |
| 4.6 | Build `ScoreTrendGraph` | NOT STARTED | Existing graphs show raw vitals, not composite scores |
| 4.7 | Implement deterioration alert engine | NOT STARTED | No alert system |
| 4.8 | Build `AlertDialog` component | NOT STARTED | No alert dialogs |
| 4.9 | Assemble `DeteriorationView` | NOT STARTED | Current "Managing Deterioration" view is just `VitalsView` (plain table) |
| 4.10 | Extend patient JSON with `supplementalO2` and `consciousnessLevel` | NOT STARTED | JSON schema has `avpu` but not `supplementalO2`. `normalizePatientData` maps `supplementalOxygen` field but no patient data includes it |
| 4.11 | Build EWS Dashboard (population-level) | NOT STARTED | No multi-patient view beyond search list |

### Phase 5: Interactive View (iView) Implementation — Status: NOT STARTED (0/10)

| # | Task | Status | Evidence |
|---|---|---|---|
| 5.1 | Design iView data model and extend TypeScript types | NOT STARTED | No iView data structures |
| 5.2 | Build `NavigatorPanel` with collapsible bands | NOT STARTED | Sidebar has collapsible sections but no iView-style bands |
| 5.3 | Build `FlowsheetSection` | NOT STARTED | No time-columned flowsheet exists |
| 5.4 | Build `IViewToolbar` | NOT STARTED | No iView toolbar |
| 5.5 | Build `AssessmentForm` | NOT STARTED | No cell-click documentation input |
| 5.6 | Implement default band configurations | NOT STARTED | No band system |
| 5.7 | Wire vital signs entry through iView with NEWS2 | NOT STARTED | Vitals are read-only throughout the application |
| 5.8 | Implement shift-based aggregation | NOT STARTED | No shift awareness |
| 5.9 | Assemble `InteractiveView` | NOT STARTED | No iView component |
| 5.10 | Implement band customisation | NOT STARTED | No band system |

### Phase 6: MAR Enhancements — Status: NOT STARTED (0/10)

| # | Task | Status | Evidence |
|---|---|---|---|
| 6.1 | Design MAR time grid data model | NOT STARTED | Current `MARView` (lines 1835-1865) is a flat table, no time grid logic |
| 6.2 | Build `MARGrid` | NOT STARTED | No time-columned grid |
| 6.3 | Build `MARCell` | NOT STARTED | No cell component |
| 6.4 | Implement MAR colour logic | NOT STARTED | All rows are plain white/alternating grey |
| 6.5 | Build `AdminDialog` | NOT STARTED | No medication administration workflow; MAR is read-only |
| 6.6 | Build `TherapeuticClassNav` | NOT STARTED | No medication grouping |
| 6.7 | Implement PRN medication section | NOT STARTED | PRN meds shown in same table as scheduled (identified by "PRN" in schedule column) |
| 6.8 | Implement administration history | NOT STARTED | No history tracking |
| 6.9 | Assemble enhanced `MARView` | NOT STARTED | Current MAR is basic list view only |
| 6.10 | Implement overdue medication alerting | NOT STARTED | No alerting |

### Phase 7: Cross-Cutting Enhancements — Status: NOT STARTED (0/9)

| # | Task | Status | Evidence |
|---|---|---|---|
| 7.1 | Implement simulation clock with time-travel | NOT STARTED | `StatusBar` shows real `Date()` time only |
| 7.2 | Enhanced allergy alert banner | NOT STARTED | Allergies shown as plain text in `PatientBanner` — no colour coding or interaction warnings |
| 7.3 | SBAR handover summary auto-generation | NOT STARTED | No SBAR feature |
| 7.4 | Print/PDF export | NOT STARTED | No print styles or export |
| 7.5 | Unit tests for NEWS2 calculator | NOT STARTED | No tests, no test framework |
| 7.6 | Unit tests for MAR time grid logic | NOT STARTED | No tests, no test framework |
| 7.7 | Integration tests for key workflows | NOT STARTED | No tests, no test framework |
| 7.8 | Session action logging to IndexedDB | NOT STARTED | Logger writes to console only |
| 7.9 | Create scenario runner | NOT STARTED | No scenario automation |

### Phase 8: Polish & Deployment — Status: NOT STARTED (0/7)

| # | Task | Status | Evidence |
|---|---|---|---|
| 8.1 | Responsive layout adjustments | NOT STARTED | Fixed-width sidebar (130px), no responsive breakpoints |
| 8.2 | Accessibility audit | NOT STARTED | No ARIA labels, limited keyboard navigation (only Autocomplete has it) |
| 8.3 | Performance optimisation (lazy loading, code splitting) | NOT STARTED | Single file, no code splitting possible |
| 8.4 | Docker containerisation | NOT STARTED | No Dockerfile. DEPLOYMENT.md describes manual setup |
| 8.5 | CI/CD pipeline | NOT STARTED | No GitHub Actions or CI config |
| 8.6 | Documentation update | NOT STARTED | README.md, QUICKSTART.md, DEPLOYMENT.md exist but describe current monolith |
| 8.7 | Remove legacy `emr-sim-v2.html` | NOT STARTED | It's still the entire application |

---

### Recommended Next Steps (Priority Order)

1. **Phase 0.1**: Scaffold the Vite + React + TypeScript project — this unblocks everything
2. **Phase 0.2**: Define TypeScript interfaces from the existing JSON shapes in `jetson-judy.json` and `patient-template.json`
3. **Phase 0.3 + 0.4 + 0.5** (parallel): Extract CSS, set up React Router, create Zustand stores
4. **Phase 1.8**: Build `FlowsheetGrid` early — it's reused by Phases 4, 5, and 6
5. **Phase 4.1**: Implement NEWS2 calculator — high clinical value, unblocks deterioration + iView features

### Metrics

| Metric | Value |
|---|---|
| Total tasks in backlog | 86 |
| Tasks completed | 0 |
| Tasks in progress | 0 |
| Tasks not started | 86 |
| Completion percentage | 0% |
| Critical path tasks | 28 (marked `[CP]`) |
| Critical path tasks completed | 0 |
| Estimated phases to feature parity | Phase 0 + Phase 1 + Phase 2 (24 tasks) |
| Estimated phases to full plan | Phase 0 through Phase 8 (86 tasks) |
