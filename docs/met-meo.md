# MET-MEO / ACC Workflow and Dialog Layout Specification

> **Purpose:** Comprehensive reference for reconstructing the MET-MEO (Modified Escalation and Observation) and ACC (Altered Calling Criteria) digital workflows as implemented in the Queensland Health Cerner ieMR.
>
> **Source:** Screenshots from the Cerner ieMR system at RBWH / Metro North Health, combined with the Q-ADDS Complete Scoring & Escalation Reference.
>
> **Date:** March 2026 | **Author:** REdI Team

---

## 1. System Context and Terminology

### 1.1 Key Abbreviations

| Abbreviation | Full Term | Notes |
|---|---|---|
| Q-ADDS | Queensland Adult Deterioration Detection System | The overarching EWS framework |
| EWS / EW Score | Early Warning Score | The calculated total Q-ADDS score (0–10+) |
| MET | Medical Emergency Team | Hospital rapid response team |
| MEO | Modified Escalation and Observation | The plan framework within ieMR |
| MET-MEO | MET-Modified Escalation and Observation | Specific plan type for patients meeting MET call criteria (≥8 or E zone) |
| ACC | Altered Calling Criteria | Legacy term — this functionality is **no longer available** in the ieMR. Has been replaced by MET-MEO |
| MOF | Modified Observation Frequency | Order to reduce observation frequency (SMO authorisation only) |
| ARP | Acute Resuscitation Plan | Separate clinical document defining resuscitation goals |
| SMO | Senior Medical Officer | Consultant-level authorisation required for MET-MEO and MOF |
| MO | Medical Officer | The ordering clinician (Registrar or SMO) |
| TL | Team Leader | Nursing team leader |
| ieMR | Integrated Electronic Medical Record | Queensland Health's Cerner-based EMR |

### 1.2 Relationship Between ACC and MET-MEO

The MET-MEO Plan Order form explicitly states at the top:

> *"Altered Calling Criteria/EW score reduction is no longer available in the iEMR."*

The MET-MEO system replaces the legacy ACC functionality. Where older documentation or training materials reference "ACC," the digital equivalent is now the MET-MEO Plan within the MEO framework. The MEO Plan dialog in ieMR provides two distinct order types that together replace the former ACC:

1. **Order Modified Observation Frequency** — reduces observation frequency (replaces the frequency-reduction component of ACC)
2. **Order MET-MEO Plan** — modifies the escalation response for patients in the MET range (replaces the calling-criteria-modification component of ACC)

---

## 2. Workflow Overview

### 2.1 Trigger Conditions

The MET-MEO workflow is triggered when a patient meets **MET call criteria**, defined as either:

1. **Total EW Score ≥8**, OR
2. **Any single vital sign parameter is in the purple/E zone**

When either condition is met, the ieMR fires a **Discern Alert** displaying "MET Call Criteria Met" in the Interactive View.

### 2.2 Clinical Decision Flow

```
Patient has vital signs entered
        │
        ▼
  ieMR calculates EWS
        │
        ▼
  ┌─────────────────────────┐
  │ EWS ≥8 or E zone param? │
  └────────┬────────────────┘
           │
     ┌─────┴─────┐
     │ YES       │ NO
     ▼           ▼
  Discern Alert  Standard escalation
  fires          per graded response
     │           table (Section 5.2
     │           of Q-ADDS reference)
     ▼
  ┌──────────────────────────────┐
  │ MO assesses patient:        │
  │ - Is there a treatment plan? │
  │ - Is the team aware?         │
  │ - Is it safe to remain on    │
  │   the ward?                  │
  └──────────┬───────────────────┘
             │
       ┌─────┴──────┐
       │ ALL YES    │ ANY NO
       ▼            ▼
  MO navigates to   Standard MET
  Managing          call initiated
  Deterioration     per protocol
  page
       │
       ▼
  MEO Plan dialog
  opens
       │
       ▼
  ┌────────────────────────┐
  │ MO selects one of:     │
  │                        │
  │ A) Order Modified      │
  │    Observation         │
  │    Frequency           │
  │                        │
  │ B) Order MET-MEO Plan  │
  │                        │
  │ C) Cancel current      │
  │    order               │
  └────────────────────────┘
```

### 2.3 Navigation Path

1. **Vital Signs** are entered (manually or via device integration)
2. If EWS ≥8 or E zone → **Discern Alert** fires in **Interactive View** (or Vital Signs result view)
3. Clinician navigates to **Managing Deterioration** page (left-hand navigation menu)
4. On the Managing Deterioration page, the **MEO Plan** section appears at the bottom of the graphing area
5. Clicking within the MEO Plan section opens the **MEO Plan dialog**
6. From the dialog, the MO can select to order either a **Modified Observation Frequency** or a **MET-MEO Plan**
7. Selecting either option opens the corresponding **order form**

---

## 3. Dialog and Form Layout Specifications

### 3.1 Discern Alert — EW Score Popup (Interactive View)

**Trigger:** Automatically fires when vital signs result in an EWS that meets alert thresholds. Multiple alert levels exist; the screenshots show the EW Score 4-5 variant.

**Location:** Appears as a modal popup overlay in the **Interactive View** or **Vital Signs** result view.

**Visual Appearance:** White modal dialog box with a thin border, appearing over the vitals data grid.

#### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  EW Score 4-5                                          │
│                                                         │
│  Do not close: Go to Managing Deterioration graph      │
│  page to review vital signs                            │
│                                                         │
│  ┌───────────────────┬──────────────────────────────┐  │
│  │ Clinical status   │ Required actions              │  │
│  ├───────────────────┼──────────────────────────────┤  │
│  │ Deteriorating     │ Select Additional Criteria    │  │
│  │                   │ button on Managing            │  │
│  │ 1. Concern patient│ Deterioration page for        │  │
│  │    is worse or not│ required escalation and       │  │
│  │    improving      │ observation actions           │  │
│  │ 2. New            │                               │  │
│  │    contributing   │                               │  │
│  │    Vital Sign(s)  │                               │  │
│  │ 3. Score higher   │                               │  │
│  │    than last score│                               │  │
│  ├───────────────────┼──────────────────────────────┤  │
│  │ Stable            │ Select Additional Criteria    │  │
│  │                   │ button on Managing            │  │
│  │ None of the 3     │ Deterioration page for        │  │
│  │ deteriorating     │ required observation actions  │  │
│  │ factors above     │                               │  │
│  └───────────────────┴──────────────────────────────┘  │
│                                                         │
│  Could it be SEPSIS? If yes: follow Queensland         │
│  Sepsis Care Pathway                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Content Rules by EWS Range

The Discern Alert content varies by EWS range. Based on the Q-ADDS escalation table:

| EWS Range | Alert Title | Deteriorating Actions | Stable Actions |
|---|---|---|---|
| 1–3 | EW Score 1-3 | Notify TL; Nurse escort; 1 hourly obs | 4th hourly obs (min) |
| 4–5 | EW Score 4-5 | Select Additional Criteria on Managing Deterioration page | Select Additional Criteria on Managing Deterioration page |
| 6–7 | EW Score 6-7 | Notify TL; Registrar review within 30 min; ½ hourly obs | 1 hourly obs (min) |
| ≥8 or E | MET Call Criteria Met | Initiate MET call; 10 minutely obs; Registrar ensure Consultant notified | ½ hourly obs (min) — or as per MET-MEO |

**Key visual elements:**
- Bold heading with EW Score range
- Bold instruction line "Do not close: Go to Managing Deterioration..."
- Two-column table with "Clinical status" and "Required actions"
- "Deteriorating" row includes the 3 deterioration criteria as a numbered list
- "Stable" row references absence of all 3 factors
- **SEPSIS** appears in bold red text at the bottom as a prompt
- The word "Managing" in the required actions column is bold

### 3.2 Managing Deterioration Page (M-Page)

**Location:** Accessed via the left-hand navigation menu item "Managing Deterioration" (highlighted in yellow/gold when active).

**Purpose:** Provides graphical trending of vital signs with colour-coded Q-ADDS zones, plus the MEO Plan management section.

#### Page Structure (Top to Bottom)

```
┌─────────────────────────────────────────────────────────────────┐
│ Adult Q-ADDS [warning triangle icon]                            │
│                                                                 │
│ [Frequency] Not specified. Follow local protocols.              │
│ [ACC/NRR]   Review by: not specified                           │
│                                                                 │
│ Timeframe: [24 hours ▼]  < [date] [time] >  [Clear Changes]   │
│            RR  SpO2  BP  HR  T                                  │
│ [Reset Zoom] [Alert History] [Additional Criteria]              │
│ [Overview] [Print - Full...] [Print - Brief...]                │
├─────────────────────────────────────────────────────────────────┤
│ ▼ Pulse Rhythm  [Add]                                          │
│   [Timeline grid with data points]                             │
├─────────────────────────────────────────────────────────────────┤
│ ▼ Temperature  [Add]                                           │
│   [Graph with colour-coded zones]                              │
│   Y-axis: T(°C) range ~33.0–40.0                              │
│   Zones: Green (normal), Yellow, Orange, Red/Purple            │
├─────────────────────────────────────────────────────────────────┤
│ ▼ CAVPU  [Add]                                                 │
│   Rows: Changing Behaviour | Alert | Verbal | Pain |           │
│          Unresponsive                                          │
│   [Data points plotted on timeline]                            │
├─────────────────────────────────────────────────────────────────┤
│ ▼ EW Score Table  [Add]                                        │
│   Rows: EW Score | Observation comments                        │
│         Acute ACC in Place                                     │
│   [Numeric scores displayed at time points, e.g. [3] 3, [4] 2]│
├─────────────────────────────────────────────────────────────────┤
│ ▼ EW Score Graph  [Add]                                        │
│   Y-axis: EW Score 0–10                                        │
│   Colour zones:                                                │
│     Green  (0): bottom band                                    │
│     Yellow (1–3): lower-middle band                            │
│     Orange (4–7): upper-middle band                            │
│     Purple/Pink (≥8): top band                                 │
│   [Line graph of EW scores over time]                          │
├─────────────────────────────────────────────────────────────────┤
│ MEO Plan  [Add Modified Observations, Post MET-MEO orders      │
│            and nursing instructions]                           │
│                                                                 │
│   ┌──────────────────────────┬──────────┬──────────┬───────┐   │
│   │ MET-MEO expiry           │ [value]  │ [value]  │       │   │
│   ├──────────────────────────┼──────────┼──────────┼───────┤   │
│   │ MET-MEO VS acceptable    │ [value]  │ [value]  │       │   │
│   │ range                    │          │          │       │   │
│   └──────────────────────────┴──────────┴──────────┴───────┘   │
│   Note: Rows collapsed if absent (99% of the time)             │
├─────────────────────────────────────────────────────────────────┤
│ ▼ Sedation Score  [Add]                                        │
│   Rows: 0 = Awake | 1 = Mild | 2 = Moderate | 3 = Severe      │
├─────────────────────────────────────────────────────────────────┤
│ ▼ Neurological  [Add]                                          │
│   Rows: Coma Score | Eyes Open | [other GCS components]        │
└─────────────────────────────────────────────────────────────────┘
```

#### Key Visual Details

- **Header bar:** Contains "Adult Q-ADDS" with a yellow warning triangle icon, frequency/ACC status fields, and a timeframe selector with date/time navigation
- **Quick-access buttons:** Top-right cluster includes "Reset Zoom", "Alert History", "Additional Criteria", "Overview", "Print - Full...", "Print - Brief..."
- **Vital sign shortcut links:** "RR SpO2 BP HR T" appear as clickable links to jump to specific parameter graphs
- **Each section** is collapsible (▼ toggle) with an "[Add]" button for data entry
- **Colour-coded graph zones** use the Q-ADDS colour scheme: green (normal/score 0), yellow (score 1-3), orange (score 4-7), purple/pink (score ≥8 or E)
- **EW Score Graph** is the primary visual element, showing a line graph of scores plotted against the coloured zone bands
- **MEO Plan section** sits between EW Score Graph and Sedation Score, with a blue hyperlink "[Add Modified Observations, Post MET-MEO orders and nursing instructions]"
- **MEO Plan data rows** show when a MET-MEO is active: "MET-MEO expiry" with date/times and "MET-MEO VS acceptable range" with parameter values (e.g., "HR 60-170"). These rows are **collapsed/hidden when no active MET-MEO exists**, which is the majority of the time

#### EW Score Graph Zone Colours (Approximate)

| Zone | Score Range | Colour | Hex (Approximate) |
|---|---|---|---|
| Normal | 0 | Green | #90EE90 / light green |
| Low concern | 1–3 | Yellow | #FFFF99 / pale yellow |
| Moderate concern | 4–5 | Light orange | #FFD699 / light orange |
| High concern | 6–7 | Orange | #FFC266 / orange |
| MET range | ≥8 | Purple/Pink | #E6B3FF / light purple-pink |

### 3.3 MEO Plan Dialog (Modal Overlay)

**Trigger:** Clicking the MEO Plan "[Add Modified Observations...]" link on the Managing Deterioration page.

**Appearance:** Large modal dialog overlaying the Managing Deterioration page. The background page remains partially visible behind the dialog.

**Title:** "MEO (Modified Escalation and Observation) Plan"

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│       MEO (Modified Escalation and Observation) Plan           │
│                                                                 │
│  Medical Officer Order Section:                                │
│  (Medical Officer Only)                                        │
│                                                                 │
│  ○ [Order Modified Observation Frequency]  ○ Cancel current    │
│                                               order            │
│  ○ [Order MET-MEO Plan]                    ○ Cancel current    │
│                                               order            │
│                                                                 │
│  ─────────────────────────────────────────────────────────     │
│                                                                 │
│  Nursing Section:                                              │
│  Nursing MET-MEO instructions:                                 │
│  Check MET-MEO expiry, if not expired, then follow the        │
│  below table:                                                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Total EW Score is in the MET range (≥8)                 │   │
│  │                                                         │   │
│  │ ┌────────┬─────────────────────┬──────────────────────┐ │   │
│  │ │ Q-ADDS │ Clinical status     │ Required actions     │ │   │
│  │ │ score  │                     │                      │ │   │
│  │ ├────────┼─────────────────────┼──────────────────────┤ │   │
│  │ │        │ Concern patient is  │ • Initiate MET Call  │ │   │
│  │ │  ≥8    │ worse or not        │ • 10 minutely obs    │ │   │
│  │ │        │ improving           │ • Registrar to       │ │   │
│  │ │        │ NEW contributing    │   ensure Consultant  │ │   │
│  │ │        │ vital sign(s)       │   is notified        │ │   │
│  │ │        │ Score higher than   │ • Registrar and      │ │   │
│  │ │        │ last score          │   Nurse escort for   │ │   │
│  │ │        │  [DETERIORATING]    │   transfers          │ │   │
│  │ ├────────┼─────────────────────┼──────────────────────┤ │   │
│  │ │        │ None of the 3       │ • ½ hourly obs       │ │   │
│  │ │        │ deteriorating       │   (minimum)          │ │   │
│  │ │        │ factors above       │                      │ │   │
│  │ │        │ [STABLE OR          │                      │ │   │
│  │ │        │  IMPROVING]         │                      │ │   │
│  │ └────────┴─────────────────────┴──────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Vital Sign is in MET range (purple zone)                │   │
│  │                                                         │   │
│  │ ┌────────┬─────────────────────┬──────────────────────┐ │   │
│  │ │ Q-ADDS │ Clinical status     │ Required actions     │ │   │
│  │ │ score  │                     │                      │ │   │
│  │ ├────────┼─────────────────────┼──────────────────────┤ │   │
│  │ │        │ Concern patient is  │ • Initiate MET Call  │ │   │
│  │ │        │ worse or not        │ • 10 minutely obs    │ │   │
│  │ │  E     │ improving           │ • Registrar to       │ │   │
│  │ │        │ Any vital sign(s)   │   ensure Consultant  │ │   │
│  │ │        │ worse               │   is notified        │ │   │
│  │ │        │ E zone vital sign   │ • Registrar and      │ │   │
│  │ │        │ outside accepted    │   Nurse escort for   │ │   │
│  │ │        │ range               │   transfers          │ │   │
│  │ │        │  [DETERIORATING]    │                      │ │   │
│  │ ├────────┼─────────────────────┼──────────────────────┤ │   │
│  │ │        │ None of the 3       │ • ½ hourly obs       │ │   │
│  │ │        │ deteriorating       │   (minimum)          │ │   │
│  │ │        │ factors above       │                      │ │   │
│  │ │        │ [STABLE OR          │                      │ │   │
│  │ │        │  IMPROVING]         │                      │ │   │
│  │ └────────┴─────────────────────┴──────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                         ┌──────────────────┐                   │
│  Observation Comments   │                  │                   │
│                         │  [free text box]  │                   │
│                         │                  │                   │
│                         └──────────────────┘                   │
│                                                                 │
│  Patient status                                                │
│  ○ Stable                                                      │
│  ○ Deteriorating                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Key Visual Details

- **Title** "MEO (Modified Escalation and Observation) Plan" is large, centered, blue text
- **Medical Officer Order Section** heading is bold, with "(Medical Officer Only)" in smaller text beneath
- **Two order buttons:** "Order Modified Observation Frequency" and "Order MET-MEO Plan" are rendered as blue/highlighted rectangular buttons
- Each order button has a corresponding "Cancel current order" radio button to its right
- **Radio button grouping:** Each row (MOF or MET-MEO) has its own radio group: [Order] or [Cancel]
- **Nursing Section** heading is bold, larger font
- Instructions text reads: "Nursing MET-MEO instructions: Check MET-MEO expiry, if not expired, then follow the below table:"
- **"Total EW Score is in the MET range (≥8)"** is bold, underlined
- **"Vital Sign is in MET range (purple zone)"** is bold, underlined
- The Deteriorating row in the first table has a **red/highlighted background** to draw attention
- The Deteriorating row in the E-zone table also has a **red/highlighted background**
- **Key difference between the two tables:**
  - First table (≥8): Deteriorating criteria include "NEW contributing vital sign(s)" and "Score higher than last score"
  - Second table (E zone): Deteriorating criteria include "Any vital sign(s) worse" and "E zone vital sign outside accepted range"
- **Observation Comments** is a free-text box to the right of the nursing tables
- **Patient status** radio buttons (Stable / Deteriorating) appear at the bottom right

### 3.4 MET-MEO Plan Order Form

**Trigger:** MO selects "Order MET-MEO Plan" from the MEO Plan dialog.

**Appearance:** Large form dialog, either overlaying the Managing Deterioration page or as a standalone PowerForm window. Title bar reads "MET-MEO plan - DHS-DEWT, [Patient Name/Gender]" in the standalone version.

**Header Banner:** Blue background with white text title "MET-MEO (Modified Escalation and Observation) Plan Order"

#### Header Warnings (Below Title)

Three bullet-point warnings displayed in smaller text:

1. "Altered Calling Criteria/EW score reduction is no longer available in the iEMR"
2. "This order will provide a modified response for patients in the MET range where appropriate and correctly authorised"
3. "Only to be used when there is a treatment plan in place, the treating team is aware, and the patient is safe to remain on the ward"

#### Section: "Medical Officer MET-MEO Order: (Medical Officer Only)"

Subheading text: "Only to be used when there is a treatment plan in place, the treating team is aware, and the patient is safe to remain on the ward"

Then "Medical Officer MET-MEO order:" as a bold subheading.

#### STEP 1 — Criteria Check

```
┌──────────────────────────────────────────────────────────────┐
│ STEP 1  Complete this order ONLY IF either of the following  │
│         MET call criteria is reached:                        │
│                                                              │
│         1. The patient's EW score is in MET range (≥8)       │
│                                                              │
│                    And/Or                                     │
│                                                              │
│         2. The patient has a vital sign(s) is in the         │
│            purple/MET zone                                   │
└──────────────────────────────────────────────────────────────┘
```

- "STEP 1" appears as a red label/badge
- "ONLY IF" is bold
- "(≥8)" is displayed with the ≥ symbol

#### STEP 2 — Vital Sign Acceptable Range (Conditional)

```
┌──────────────────────────────────────────────────────────────┐
│ STEP 2  ONLY IF the patient has a vital sign(s) is in the   │
│         purple/MET zone:                                     │
│                                                              │
│         If not, do not complete the below table, leave blank │
│         (displayed in red italic text)                       │
│                                                              │
│         If yes, order an acceptable range for that vital     │
│         sign in the below table                              │
│                                                              │
│  Select Vital sign (single select only) and define           │
│  acceptable range:                                           │
│                                                              │
│         ┌───────────────────┬─────────┬─────────┬──────────┐ │
│         │ Vital Sign        │ Lower   │ Upper   │ Normal   │ │
│         │                   │         │         │ range    │ │
│         ├───────────────────┼─────────┼─────────┼──────────┤ │
│         │ ○ Respiratory rate│ [__]brpm│ [__]brpm│ 13-20    │ │
│         │                   │         │         │ brpm     │ │
│         ├───────────────────┼─────────┼─────────┼──────────┤ │
│         │ ○ SBP             │ [__]mmHg│ [__]mmHg│ 110-159  │ │
│         │                   │         │         │ mmHg     │ │
│         ├───────────────────┼─────────┼─────────┼──────────┤ │
│         │ ○ Heart rate      │ [__]bpm │ [__]bpm │ 50-99    │ │
│         │                   │         │         │ bpm      │ │
│         ├───────────────────┼─────────┼─────────┼──────────┤ │
│         │ ○ CAVPU           │ [dropdown ▼]      │ Alert    │ │
│         └───────────────────┴─────────┴─────────┴──────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**Field details:**

| Vital Sign | Radio Select | Lower Field | Upper Field | Unit | Normal Range | Input Type |
|---|---|---|---|---|---|---|
| Respiratory rate | ○ (highlighted blue when selected) | Numeric text input | Numeric text input | brpm | 13–20 brpm | Free text numeric |
| SBP | ○ | Numeric text input | Numeric text input | mmHg | 110–159 mmHg | Free text numeric |
| Heart rate | ○ | Numeric text input | Numeric text input | bpm | 50–99 bpm | Free text numeric |
| CAVPU | ○ | Dropdown select | (merged with Lower) | — | Alert | Dropdown |

- "Respiratory rate" label appears with a blue/highlighted background when selected
- Only **one** vital sign can be selected (single select radio group)
- The CAVPU row has a single dropdown rather than Lower/Upper numeric inputs
- Normal range column provides reference values for the clinician

#### STEP 3 — Rationale

```
┌──────────────────────────────────────────────────────────────┐
│ STEP 3                                                       │
│                                                              │
│  Enter rationale:  ┌────────────────────────────────────┐   │
│                    │                                    │   │
│                    │  [large yellow highlighted text    │   │
│                    │   input field]                     │   │
│                    │                                    │   │
│                    └────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

- "STEP 3" appears as a red label/badge
- The rationale text field is a large free-text input area
- The field has a **yellow/cream background highlight** to draw attention

#### STEP 4 — Duration and Authorisation

```
┌──────────────────────────────────────────────────────────────┐
│ STEP 4                                                       │
│                                                              │
│  Select duration:                                            │
│  -time will commence upon signing                            │
│  -Maximum 12 hours                                           │
│                                                              │
│         ┌───────────────────────┐                            │
│         │ [numeric input field] │  hours                     │
│         └───────────────────────┘                            │
│                                                              │
│  Must be authorised by an SMO or Registrar                  │
│  ("SMO or Registrar" in red bold text)                      │
│                                                              │
│  Authorising Registrar  ┌──────────────────────┐ [🔍]       │
│  or SMO                 │ [clinician lookup    ] │            │
│                         └──────────────────────┘             │
└──────────────────────────────────────────────────────────────┘
```

**Field details:**

| Field | Type | Constraints | Notes |
|---|---|---|---|
| Duration | Numeric input | Maximum 12 hours | Time commences upon signing |
| Authorising Registrar or SMO | Clinician lookup field | Must be Registrar or SMO level | Has a search/magnifying glass icon button adjacent |

- "STEP 4" appears as a red label/badge
- "SMO or Registrar" is displayed in **red bold** text
- The clinician lookup field has a **yellow/cream background** and a search icon (magnifying glass 🔍) button
- Duration maximum varies by chart variant: **12 hours** for General Adult & Chronic Hypoxia, **24 hours** for Cardiac

### 3.5 Modified Observation Frequency Order Form

**Trigger:** MO selects "Order Modified Observation Frequency" from the MEO Plan dialog.

**Appearance:** Standalone PowerForm window. Title bar reads "MET-MEO plan - DHS-DEWT, [Patient Name/Gender]"

**Title:** "Modified observation frequency order"

#### Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│        Modified observation frequency order                  │
│                                                              │
│  ○ Reduce observation Frequency (SMO authorisation only)     │
│                                                              │
│    Warning: this order means the patient will be monitored   │
│    LESS frequently                                           │
│    (Warning text in red)                                     │
│                                                              │
│    Examples where less frequent observations may be          │
│    appropriate:                                              │
│    Stable long stay/rehab patients, ceiling of care to      │
│    reduce distress                                           │
│                                                              │
│  Where acceptable/safe to do so, and with SMO               │
│  authorisation, MO can select 1 of the following to appear  │
│  in 'MO instructions for nurses' box on the Managing        │
│  Deterioration page:                                        │
│                                                              │
│  ○ Full EWS at least [___] hourly for stable [ref] long    │
│    stay or respite patients where clinical status has been   │
│    as expected for > 24 hours: (eg Rehab/residential care/  │
│    non-clinical admissions)                                  │
│                                                              │
│  ○ Full EWS at least [___] hourly in stable [ref] patient  │
│    where clinical status has been as expected for > 24      │
│    hours (eg: respiratory viruses)                           │
│                                                              │
│  ○ Full EWS at least [___] hourly to reduce distress in    │
│    unwell patient on optimal treatment where 'ward-based    │
│    care' documented on ARP                                   │
│                                                              │
│  ○ Other (free text): [_________________________________]   │
│                                                              │
│                                                              │
│       This does not replace verbal handover,                │
│       ENSURE TREATING NURSE INFORMED                        │
│       (bold, large text, centered)                          │
│                                                              │
│  Authorising SMO  ┌──────────────────────┐ [🔍]             │
│  (in red text)    │ [clinician lookup    ] │                  │
│                   └──────────────────────┘                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### Key Differences from MET-MEO Plan Order

| Aspect | MET-MEO Plan Order | Modified Observation Frequency |
|---|---|---|
| Purpose | Modify escalation response for MET-range patients | Reduce observation frequency |
| Authorisation level | SMO or Registrar | **SMO only** |
| Duration field | Yes (max 12 hours) | No explicit duration field |
| Vital sign selection | Yes (for E-zone triggers) | No |
| Rationale field | Yes (free text) | Embedded in option selection |
| Options | Single order form | Multiple preset options + free text |
| "[ref]" links | None | "stable [ref]" appears as hyperlinks (likely linking to the definition of "stable") |

#### Option Details

Each of the three preset options has:
- A radio button for selection
- An inline numeric input field (`[___]`) for specifying the frequency in hours
- The word "stable" appears as a blue hyperlink "[ref]" — likely linking to the clinical definition of stable per Q-ADDS
- Contextual examples in parentheses

The fourth option ("Other") has a large free-text input field with a yellow/cream background.

**Critical note:** "SMO authorisation only" — this form requires a **higher authorisation level** than the MET-MEO Plan Order. Only an SMO (Senior Medical Officer / Consultant) can authorise reduced observation frequency, whereas the MET-MEO Plan can be authorised by either a Registrar or SMO.

---

## 4. Data Persistence and Display

### 4.1 MEO Plan Data on Managing Deterioration Page

When an active MET-MEO order exists, the MEO Plan section on the Managing Deterioration page displays additional data rows:

| Row | Content | Format |
|---|---|---|
| MET-MEO expiry | Date and time (24hr) of order expiry | e.g., "1900 25 Jan" — displayed at each applicable time column |
| MET-MEO VS acceptable range | The vital sign and range ordered in Step 2 | e.g., "HR 60-170" — displayed at each applicable time column |

**Behaviour:**
- These rows are **visible only when a MET-MEO order is active**
- When no MET-MEO order exists (approximately 99% of patients), the rows are **collapsed and not displayed**
- The data appears in the timeline grid format, aligned with the observation time columns
- Multiple concurrent or sequential MET-MEO orders would show in their respective time columns

### 4.2 EW Score Table Data

The EW Score Table section shows:
- **EW Score** row: Numeric scores displayed in brackets with the value, e.g., "[3] 3", "[4] 2", "[3] 4"
- **Observation comments** row: Free text comments from nursing staff
- **Acute ACC in Place** row: Legacy field indicating whether an ACC/MET-MEO order was active at that observation time

### 4.3 Patient Status Assessment

The Nursing Section of the MEO Plan dialog includes a **Patient status** assessment with two radio buttons:
- **Stable** — select when none of the 3 deteriorating factors are present
- **Deteriorating** — select when any of the 3 deteriorating factors are present

This selection drives the required actions per the nursing instruction tables in the MEO Plan dialog.

---

## 5. Nursing Workflow Under Active MET-MEO

### 5.1 Nursing Decision Tree

When a MET-MEO is active, the nurse follows this decision process at each assessment:

```
Check MET-MEO expiry
        │
  ┌─────┴──────┐
  │ Expired    │ Not expired
  ▼            ▼
Standard       Assess patient status
escalation     using 3 deterioration
resumes        criteria
               │
         ┌─────┴──────┐
         │            │
  Deteriorating    Stable/Improving
         │            │
         ▼            ▼
  ┌──────────────┐  ½ hourly
  │ Is it EWS ≥8 │  observations
  │ or E zone?   │  (minimum)
  └──────┬───────┘
         │
   ┌─────┴─────┐
   │           │
  EWS ≥8    E zone
   │           │
   ▼           ▼
  Initiate   Initiate MET Call
  MET Call   (if vital sign outside
  10 min obs accepted range)
  Notify     10 min obs
  Consultant Notify Consultant
  Escort     Escort
```

### 5.2 Deterioration Criteria Differences by Trigger Type

| Criterion | EWS ≥8 Trigger | E Zone Trigger |
|---|---|---|
| Criterion 1 | Concern patient is worse or not improving | Concern patient is worse or not improving |
| Criterion 2 | **NEW contributing vital sign(s)** | **Any vital sign(s) worse** |
| Criterion 3 | **Score higher than last score** | **E zone vital sign outside accepted range** |

This is a critical distinction. For E-zone triggers, the deterioration assessment references the **accepted range** specified by the MO in Step 2 of the MET-MEO Plan Order, rather than comparing to the previous score.

---

## 6. Form Validation and Business Rules

### 6.1 MET-MEO Plan Order Validation

| Field | Validation Rule |
|---|---|
| Step 1 criteria | At least one criterion must be met (EWS ≥8 or E zone) |
| Step 2 vital sign | Required **only if** E zone is the trigger; leave blank otherwise |
| Step 2 lower/upper range | Numeric values required when vital sign selected; CAVPU uses dropdown |
| Step 3 rationale | Required (free text) |
| Step 4 duration | Numeric, 1–12 hours (or 1–24 for Cardiac variant) |
| Step 4 authorising clinician | Required; must be Registrar or SMO level |

### 6.2 Modified Observation Frequency Validation

| Field | Validation Rule |
|---|---|
| Option selection | Exactly one option must be selected |
| Frequency value | Numeric hours required in the inline input |
| Authorising SMO | Required; must be SMO level (Registrar not sufficient) |

### 6.3 Duration Rules by Chart Variant

| Chart Variant | MET-MEO Max Duration | Source |
|---|---|---|
| General Adult (SW150) | 6 hours (paper) / 12 hours (digital form) | Paper chart says 6h; digital form says 12h maximum |
| Chronic Hypoxia (SW1171) | 6 hours (paper) / 12 hours (digital form) | Same discrepancy |
| Cardiac (SW626) | 24 hours | Consistent across paper and digital |

> **Note:** There is an apparent discrepancy between the paper chart maximum (6 hours) and the digital form maximum (12 hours) for General Adult and Chronic Hypoxia variants. The digital form explicitly states "Maximum 12 hours." This may reflect a policy update in the digital implementation or a configuration difference. This should be verified with the current operational policy.

---

## 7. Integration Points

### 7.1 Discern Alert System

The Discern Alert system is the primary mechanism for surfacing EWS-triggered clinical decision support. Alerts fire in the Interactive View when vital signs are entered. The alerts present the escalation response table appropriate to the EWS range and direct the clinician to the Managing Deterioration page.

### 7.2 CareCompass Integration

CareCompass is the nursing task management system within Cerner. Vital sign observation tasks can be ordered and tracked through CareCompass. When a MET-MEO modifies observation frequency, this likely integrates with CareCompass task scheduling, though the specific mechanism is not visible in the screenshots.

### 7.3 Left Navigation Menu Context

The Managing Deterioration page is accessed via the ieMR left navigation menu. The full menu structure visible in the screenshots includes:

1. Menu
2. Doctor View
3. Patient Summary
4. **Managing Deterioration** (highlighted when active)
5. Acute Resus Plan (ARP)
6. Acute Resus Plan (ARP) [appears twice — may be different ARP types]
7. Advance Care Planning
8. Patient Timeline
9. Orders + Add
10. MAR
11. MAR Summary
12. Glucose Management View
13. Allergies + Add
14. Activities and Interventions
15. Interactive View
16. Results
17. Lines/Tubes/Drains Summary
18. Clinical Notes View
19. Alerts and Problems
20. Powerforms (partially visible)

### 7.4 Vital Signs Result View

The first screenshot shows the Vital Signs view (accessible from the top-level tabbed interface, not the left navigation). This view shows:
- A result grid with columns: Result, Comments, Flag, Date, Performed By
- Selectable vital sign categories in a left sidebar dropdown (Adult..., Vital S..., Measur..., Medica..., Hourly, Pain A..., Pain In..., Comfor..., Clinica..., Clinica..., Safety, Preope..., Estima..., Mayo S..., etc.)
- The Discern Alert popup fires over this view
- Vital sign data includes: SBP/DBP Line, Mean arterial pressure, SBP/DBP Supine, with individual readings and trend arrows (↑ ↓)

---

## 8. Reconstruction Considerations

### 8.1 Visual Fidelity Requirements

For simulation/training reconstruction, the following visual elements are critical for clinical realism:

1. **Colour-coded zones** on the EW Score Graph must match the Q-ADDS chart colours
2. **Discern Alert** popup must be modal (blocks interaction with background) and contain the correct escalation table for the EWS range
3. **MET-MEO Plan Order** form must enforce the step-by-step structure with visual step badges
4. **Yellow highlighted input fields** for rationale and clinician lookup fields
5. **Red text warnings** for authorisation requirements and frequency reduction warnings
6. **Blue hyperlink styling** for the MEO Plan action links and "[ref]" links in the MOF form

### 8.2 Functional Requirements for Reconstruction

1. **EWS calculation engine** — must correctly sum all 7 parameters per the Q-ADDS scoring tables
2. **Alert triggering logic** — must fire the correct Discern Alert based on EWS range and individual parameter E-zone status
3. **Conditional form logic** — Step 2 of MET-MEO Plan Order is only required when E-zone is the trigger
4. **Duration countdown** — MET-MEO expiry must be calculated from signing time + ordered duration
5. **Patient status assessment** — nursing staff must be able to record Stable/Deteriorating at each assessment
6. **Clinician lookup** — the authorising clinician field requires a search/lookup function (not free text)

### 8.3 Data Model Considerations

```
MET_MEO_Order {
    order_id: unique identifier
    patient_id: FK to patient
    order_type: ENUM ['MET_MEO_PLAN', 'MODIFIED_OBS_FREQUENCY']
    trigger_type: ENUM ['EWS_GTE_8', 'E_ZONE', 'BOTH']
    
    // Step 2 - E Zone details (nullable)
    e_zone_vital_sign: ENUM ['RR', 'SBP', 'HR', 'CAVPU'] | NULL
    e_zone_lower_bound: DECIMAL | NULL
    e_zone_upper_bound: DECIMAL | NULL
    e_zone_cavpu_level: ENUM ['Alert', 'Voice', ...] | NULL
    
    // Step 3
    rationale: TEXT
    
    // Step 4
    duration_hours: INTEGER  // max 12 or 24 by variant
    authorising_clinician_id: FK to clinician
    authorising_clinician_role: ENUM ['REGISTRAR', 'SMO']
    
    // Timestamps
    signed_at: DATETIME
    expires_at: DATETIME  // signed_at + duration_hours
    cancelled_at: DATETIME | NULL
    cancelled_by: FK to clinician | NULL
    
    // Status
    status: ENUM ['ACTIVE', 'EXPIRED', 'CANCELLED']
}

Modified_Obs_Frequency_Order {
    order_id: unique identifier
    patient_id: FK to patient
    
    option_selected: ENUM [
        'LONG_STAY_RESPITE',
        'STABLE_EXPECTED',
        'REDUCE_DISTRESS_ARP',
        'OTHER'
    ]
    frequency_hours: INTEGER
    other_free_text: TEXT | NULL  // only when option = OTHER
    
    authorising_smo_id: FK to clinician  // SMO only, not Registrar
    
    signed_at: DATETIME
    cancelled_at: DATETIME | NULL
    status: ENUM ['ACTIVE', 'CANCELLED']
}

Nursing_Assessment {
    assessment_id: unique identifier
    patient_id: FK to patient
    met_meo_order_id: FK to MET_MEO_Order | NULL
    
    assessment_time: DATETIME
    patient_status: ENUM ['STABLE', 'DETERIORATING']
    observation_comments: TEXT | NULL
    
    // If deteriorating, which criteria triggered
    criterion_concern_worse: BOOLEAN
    criterion_new_vital_signs: BOOLEAN  // or any_vital_signs_worse for E zone
    criterion_score_higher: BOOLEAN     // or e_zone_outside_range for E zone
}
```

---

## Appendix A: Screenshot Index

| Screenshot | Filename | Content | Key Elements |
|---|---|---|---|
| 1 | Screenshot_2026-03-02_172650 | Vital Signs view with Discern Alert popup | EW Score 4-5 alert, sepsis prompt, vital signs data grid |
| 2 | Screenshot_2026-03-02_172754 | MET-MEO Plan Order form (standalone) | Full 4-step form with all fields visible |
| 3 | Screenshot_2026-03-02_172915 | Managing Deterioration page with MEO Plan link | EW Score graph, MEO Plan section, annotation "MO selects to order MEO" |
| 4 | Screenshot_2026-03-02_172930 | MEO Plan dialog with MET-MEO Plan selected | Order buttons, nursing tables, annotation "MO selects to order MET-MEO Plan" |
| 5 | Screenshot_2026-03-02_172948 | MET-MEO Plan Order form (in-context overlay) | Same form as #2 but overlaying Managing Deterioration page |
| 6 | Screenshot_2026-03-02_173004 | Managing Deterioration page with active MET-MEO data | MEO Plan rows showing expiry and VS acceptable range, annotation about collapsed rows |
| 7 | Screenshot_2026-03-02_173020 | Full Managing Deterioration page with MEO dialog | Complete view showing left nav, all graph sections, MEO dialog overlay, patient status |
| 8 | Screenshot_2026-03-02_173048 | Modified Observation Frequency order form | SMO authorisation, 3 preset options + Other, verbal handover warning |

---

*Document compiled for REdI (Resuscitation Education Initiative) team.*
*Source: Cerner ieMR screenshots and Q-ADDS Complete Scoring Reference.*
*Last updated: March 2026*
