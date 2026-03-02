# Q-ADDS Complete Scoring & Escalation Reference

> **Compiled from official Queensland Health Q-ADDS observation charts**
> Sources: SW150 General Adult (v10.00, 01/2025), SW626 Cardiac (v4.00, 03/2023), SW1171 Chronic Hypoxia/Hypercapnia Respiratory (v2.00, 03/2025)

---

## 1. System Overview

The Queensland Adult Deterioration Detection System (Q-ADDS) is a **cumulative weighted physiological scoring system** for adult inpatients. Seven vital sign parameters are each scored independently (0, 1, 2, 3, 4, or E), and the individual scores are summed to produce a **Total Q-ADDS Score**. The score drives a graded escalation and observation response.

**Score values:** 0 (normal), 1–4 (increasing deviation from normal), E (Emergency — triggers immediate emergency call regardless of total score).

**Total Q-ADDS Score formula:**
```
Total = Respiratory Rate + O₂ Saturation + Oxygen Delivery + Blood Pressure + Heart Rate + Temperature + Behaviour/Consciousness
```

**Critical rule:** All 7 vital signs must be recorded to generate a score. If any parameter is missing, no EWS is calculated.

---

## 2. Chart Variants

Queensland Health publishes multiple Q-ADDS chart variants. The **core scoring is identical across variants** for 6 of the 7 parameters. The only parameter that differs between variants is **O₂ Saturation**, which has modified ranges for patients with chronic respiratory conditions. Additional specialty-specific observations are appended to some variants but do not contribute to the Q-ADDS score.

| Variant | WINC Code | Version | SpO₂ Scoring | Specialty Additions |
|---------|-----------|---------|--------------|---------------------|
| General Adult Inpatient | SW150 | v10.00 (01/2025) | Standard | Nil |
| Cardiac (onsite angiography) | SW626 | v4.00 (03/2023) | Standard | Cardiac rhythm, pulses, pleth, circulation, puncture site, chest auscultation, suspected cardiac pain, MAP, check alarm parameters |
| Chronic Hypoxia/Hypercapnia Respiratory | SW1171 | v2.00 (03/2025) | Modified (lower target, wean O₂ prompt) | Nil additional |

**Additional variants exist** (e.g., primary/community facilities, maternity [QMEWT], paediatric [CEWT]) but are not covered in this reference.

---

## 3. Parameter Scoring Tables

### 3.1 Respiratory Rate (breaths/min) — ALL VARIANTS IDENTICAL

*Must be measured for a full minute.*

| Score | Range |
|-------|-------|
| **E** | ≤8 |
| 1 | 9–12 |
| 0 | 13–16 |
| 0 | 17–20 |
| 1 | 21–24 |
| 2 | 25–30 |
| 4 | 31–35 |
| **E** | ≥36 |

### 3.2 O₂ Saturation (%) — TWO VARIANTS

#### Standard (General Adult SW150 & Cardiac SW626)

| Score | Range |
|-------|-------|
| 0 | ≥98 |
| 0 | 95–97 |
| 0 | 92–94 |
| 1 | 90–91 |
| 2 | 85–89 |
| 4 | ≤84 |

*No E zone for SpO₂ in any variant.*

#### Chronic Hypoxia/Hypercapnia (SW1171)

| Score | Range | Notes |
|-------|-------|-------|
| 0 | ≥93% on oxygen | **"Wean O₂" prompt displayed** |
| 0 | ≥93% on air | Normal |
| 0 | 88–92% | Accepted target range for this population |
| 1 | 86–87% | |
| 2 | 84–85% | |
| 4 | ≤83% | |

**Key difference:** The chronic hypoxia variant accepts significantly lower SpO₂ as normal (88–92% scores 0, vs. scoring 0 only at ≥92% on standard). Additionally, achieving ≥93% on supplemental oxygen triggers a clinical prompt to wean oxygen, reflecting the risk of oxygen-induced hypercapnia in this population.

### 3.3 Oxygen Delivery (L/min or % delivered) — ALL VARIANTS IDENTICAL

*If on High Flow (HF) or Non-Invasive Ventilation (NIV), use % delivered.*

| Score | L/min | % Delivered |
|-------|-------|-------------|
| 0 | <2 | <28% |
| 1 | 2–5 | 28–40% |
| 2 | >5–11 | >40–50% |
| 4 | >11–14 | >50–59% |
| **E** | 15 | ≥60% |

**Oxygen delivery modes documented:** RA (Room air), NP (Nasal prongs), FM (Face mask), HFNP (High flow nasal prongs), HF (High flow), NRM (Non-rebreather), NIV (Non-invasive ventilation), T/TM (Tracheostomy/Tracheostomy mask), PRB (Partial rebreather mask — General Adult only).

**Additional fields captured:** Mode, Actual FiO₂ on device screen, High Flow L/min on device screen.

**Note:** Room air patients = O₂ Flow Rate of 0 (scores 0).

### 3.4 Blood Pressure (mmHg) — ALL VARIANTS IDENTICAL

*Score systolic BP only. Diastolic is recorded but not scored. Cardiac variant also records MAP.*

| Score | Systolic BP |
|-------|-------------|
| **E** | 60s (60–69) |
| **E** | 70s (70–79) |
| 4 | 80s (80–89) |
| 2 | 90s (90–99) |
| 1 | 100s (100–109) |
| 0 | 110s (110–119) |
| 0 | 120s (120–129) |
| 0 | 130s (130–139) |
| 0 | 140s (140–149) |
| 0 | 150s (150–159) |
| 1 | 160s (160–169) |
| 2 | 170s (170–179) |
| 2 | 180s (180–189) |
| 2 | 190s (190–199) |
| 4 | ≥200 |

### 3.5 Heart Rate (beats/min) — ALL VARIANTS IDENTICAL

| Score | Range |
|-------|-------|
| **E** | ≤30s (≤39) |
| 2 | 40s (40–49) |
| 0 | 50s (50–59) |
| 0 | 60s (60–69) |
| 0 | 70s (70–79) |
| 0 | 80s (80–89) |
| 0 | 90s (90–99) |
| 1 | 100s (100–109) |
| 2 | 110s (110–119) |
| 2 | 120s (120–129) |
| 3 | 130s (130–139) |
| 4 | 140s (140–149) |
| 4 | 150s (150–159) |
| **E** | ≥160 |

### 3.6 Temperature (°C) — ALL VARIANTS IDENTICAL

| Score | Range |
|-------|-------|
| 4 | ≤34.0 |
| 2 | 34.1–35.0 |
| 1 | 35.1–36.0 |
| 0 | 36.1–36.9 |
| 0 | 37.0–37.4 |
| 0 | 37.5–37.9 |
| 1 | 38.0–38.4 |
| 2 | 38.5–39.4 |
| 2 | ≥39.5 |

*No E zone for temperature in any variant.*

### 3.7 Behaviour and Consciousness (AVPU) — ALL VARIANTS IDENTICAL

*Patient must be woken before scoring if necessary.*

| Score | Level |
|-------|-------|
| 0 | Alert |
| 1 | Voice (responds to voice) |
| 4 | Changing behaviour or New confusion |
| **E** | Pain (responds to pain only) |
| **E** | Unresponsive |

**Special rule — Changing Behaviour/New Confusion:**
- If a documented plan is in place to manage Changing Behaviour or New Confusion → score AVPU as usual (i.e., use Alert/Voice/Pain/Unresponsive instead of the score-4 "Changing behaviour" option)
- If no plan is in place → score 4

**Guide for Recognising Changing Behaviour and New Confusion:**
- Reported or observed change
- Distress
- Loss of touch with reality
- Loss of function
- Elevated risk to self, others, or property

**Response:** Escalate as per local protocol (e.g., specialty Medical or Psychiatry). If required, activate a Code Black.

---

## 4. Emergency Call Criteria

An **Emergency Call** must be initiated if ANY of the following are present:

1. Airway threat
2. Cardiac arrest
3. Respiratory arrest
4. You are concerned about the patient
5. New, repeated or prolonged seizure
6. Q-ADDS Score ≥8
7. Any observation in a purple area (E)
8. Sedation Score of 3 (severe)

**Digital implementation note:** When the EWS is ≥8 or there is a single parameter in the E zone, the ieMR displays a **"MET Call Criteria Met"** message via the Discern Alert system.

---

## 5. Escalation and Observation Plan (Tertiary and Secondary Facilities)

### 5.1 Deterioration Definition

A patient is classified as **"Deteriorating"** if ANY of the following three factors are present:
1. Clinician concern that patient is worse or not improving
2. New contributing vital sign(s)
3. Score higher than last score

If **none** of these three factors are present, the patient is classified as **"Stable or Improving."**

### 5.2 Graded Response Table

| Q-ADDS Score | Clinical Status | Observation Frequency | Notification & Actions |
|--------------|----------------|----------------------|----------------------|
| **0** | Stable/Improving | 8th hourly (min) | Nil — may be modified by SMO for long-stay patients |
| **1–3** | Deteriorating | 1 hourly | Notify Team Leader; Nurse escort for transfers |
| **1–3** | Stable/Improving | 4th hourly (min) | May be modified by SMO |
| **4–5** | Deteriorating | 1 hourly | Notify TL; Notify RMO to review within 30 min; Nurse escort; If no review after 30 min → call Registrar |
| **4–5** | Stable/Improving | 2nd hourly (min) | May be modified by SMO |
| **6–7** | Deteriorating | ½ hourly | Notify TL; Notify Registrar to review within 30 min; Nurse escort; If no review after 30 min → call MET or escalate to SMO |
| **6–7** | Stable/Improving | 1 hourly (min) | May be modified by SMO |
| **≥8 or E** | Deteriorating | 10 minutely | **Initiate MET call** (unless ARP suggests alternative); Registrar to ensure SMO notified; Registrar & Nurse escort for transfers |

**Note on ≥8 or E:** Unless on terminal care pathway. Unless ARP (Acute Resuscitation Plan) suggests alternative non-MET escalation.

### 5.3 Escalation Hierarchy

| Abbreviation | Role |
|--------------|------|
| N | Nil Required |
| TL | Team Leader |
| NM | Nurse Manager |
| RMO | Resident Medical Officer |
| Reg | Registrar |
| SMO | Senior Medical Officer / Consultant |
| E | Emergency Call |

---

## 6. MET-MEO (Modified Escalation and Observation) Plan

The MET-MEO allows **authorised modification** of the standard escalation response for patients with scores ≥8 or E.

### 6.1 Authorisation Requirements

- Must be authorised by an **SMO or Registrar**
- Maximum duration: **6 hours** (General Adult & Chronic Hypoxia) or **24 hours** (Cardiac variant)
- If an ARP is not in place, a senior clinician should consider a goals-of-care conversation

### 6.2 MET-MEO Response for Score ≥8

| Clinical Status | Required Actions |
|----------------|-----------------|
| Deteriorating | Initiate MET Call; 10 minutely observations; Registrar to ensure Consultant notified; Registrar & Nurse escort |
| Stable/Improving | ½ hourly observations (minimum) |

### 6.3 MET-MEO Response for E Zone

For E zone triggers, the MO must document:
- **Which vital sign** is in the E zone
- **SMO accepted range** for that vital sign

| Clinical Status | Required Actions |
|----------------|-----------------|
| Deteriorating (concern, any vital signs worse, or E zone vital sign outside accepted range) | Initiate MET Call; 10 minutely observations; Registrar to ensure Consultant notified; Registrar & Nurse escort |
| Stable/Improving (none of the 3 deteriorating factors) | ½ hourly observations (minimum) |

### 6.4 MET-MEO Documentation Fields

- Commencement date/time (24hr)
- Authorising Registrar or SMO (name, designation)
- Modifying Doctor (name, designation, signature)
- Completion date/time (24hr)

---

## 7. Additional Assessment Tools (NOT added to Q-ADDS Score)

### 7.1 Acute Pain Score at Rest (0–10)

| Severity | Score | Required Actions |
|----------|-------|-----------------|
| None | 0 | Nil |
| Mild | 1–3 | Consider simple analgesia |
| Moderate | 4–6 | Administer analgesia; Consider TL/MO review if no improvement within 60 min |
| Severe | 7–10 | Notify TL; Administer analgesia; Notify MO to review if no improvement within 30 min |

*For patients with chronic pain, follow individual management plan.*
*Cardiac variant specifies "Non-Cardiac Pain at Rest" and has separate cardiac chest pain row.*

**Cardiac Pain Assessment (SW626 only):**
- Any complaint of chest discomfort (non-traumatic) or jaw, neck, shoulder, arm, back or epigastric pain → follow local cardiac chest pain procedure
- Always consider atypical features: diaphoresis, shortness of breath, PE, thoracic aortic dissection, abdominal aortic aneurysm

### 7.2 Functional Activity Scale (FAS)

*Performed during cough/movement.*

| Grade | Description |
|-------|-------------|
| A | Activity unlimited by pain |
| B | Activity mild to moderately limited by pain |
| C | Activity severely limited by pain |

*If Pain Score and FAS conflict, follow the highest score.*

### 7.3 Sedation Score (0–3)

**Critical: DO NOT add Sedation Score to Q-ADDS Score.** However, Sedation Score of 3 triggers Emergency Call criteria.

*Patient must be woken to assess. For patients receiving potentially sedating medication.*

| Score | Level | Required Actions |
|-------|-------|-----------------|
| 0 | Awake | Continue to monitor per individual plan |
| 1 | Mild (easy to rouse, eyes open ≥10 sec) | Increase monitoring; Recheck before administering sedating meds |
| 2 | Moderate (rouseable, eyes open <10 sec) | Ensure O₂ & monitor SpO₂; Withhold sedating meds; Notify TL; Notify MO to review within 15 min (remain with patient); Monitor Q-ADDS/Sedation/Pain min 15 minutely; If concerned → Emergency Response |
| 3 | Severe (difficult to rouse/unrouseable) | **Initiate Emergency Response**; Ensure O₂ & monitor SpO₂; Determine need for reversal agent (naloxone, flumazenil) |

---

## 8. Sepsis Screening (General Adult & Chronic Hypoxia variants)

**Commence the Sepsis Pathway** if the patient has a known or suspected infection PLUS any of the following:

- Respiratory Rate ≥25 breaths/min
- Heart Rate ≥130 beats/min
- Systolic BP <90 mmHg
- Systolic BP drop >40 mmHg
- Temperature <35.5°C
- Temperature >38.4°C
- New oxygen requirement to keep SpO₂ >91%
- Not passed urine in last 12 hours
- Lactate ≥2 mmol/L
- Non-blanching rash / mottled / ashen / cyanotic
- Acute deterioration in functional ability
- Impaired immunity (diabetes, steroids, chemotherapy, asplenia)
- Recent chemotherapy
- Evidence of new or altered mental state
- Family members/carers concerned about mental state

**Febrile cancer patients:** Immediately notify MO if temperature ≥38°C, commence 15 minutely observations, refer to local Febrile Neutropenic Guidelines.

---

## 9. Cardiac-Specific Additional Observations (SW626 Only)

These observations are **documented on the chart but do NOT contribute to the Q-ADDS score.**

### 9.1 Cardiac Rhythm

**Monitored:** AF (Atrial Fibrillation), AFL (Atrial Flutter), HB (Heart Block), JR (Junctional Rhythm), PR (Paced Rhythm), SB (Sinus Bradycardia), SR (Sinus Rhythm), ST (Sinus Tachycardia), SVT (Supraventricular Tachycardia)

**Non-monitored:** R (Regular), I (Irregular)

### 9.2 Pulses

Assessed bilaterally (L/R) at: Dorsalis Pedis, Posterior Tibial, Radial

**Grades:** A (Absent), D (Doppler), W (Weak), N (Normal)

### 9.3 Pleth (Plethysmography)

Y (Waveform present), D (Waveform dampened), N (Waveform not present)

### 9.4 Circulation

- **Colour:** P (Pink), W (White), M (Mottled), CY (Cyanosed)
- **Warmth:** W (Warm), C (Cool), CL (Cold)
- **Movement:** Y (Yes), N (No)
- **Sensation:** Nm (Normal), A (Absent), D (Dull), P (Pins and needles)

### 9.5 Puncture Site

N (Normal), S (Swelling), H (Haematoma), B (Bleeding)

### 9.6 Chest Auscultation (L/R)

CA (Crackles in Apex), CB (Crackles in Base), CC (Chest Clear), CM (Crackles in Mid Zones), DE (Decrease Entry), W (Wheeze), WC (Widespread Crackles)

### 9.7 Additional Cardiac Fields

- Suspected Cardiac Pain (0–10 scale)
- MAP (Mean Arterial Pressure) = X
- Check Alarm Parameters (tick)

---

## 10. Digital Implementation Notes (ieMR / Cerner)

Based on the operational QRGs from Metro South Health:

- **7 vital signs required** to calculate EWS in ieMR — incomplete sets generate no score and trigger an alert requiring re-entry
- **Welch Allyn 6000 series (CVSM)** integration via Spot Check Mode with Aztec barcode PPID scanning
- **Phillips Bedside Monitor (BSM)** can auto-populate observations
- **VSM calculates and displays EWS on-device** but does NOT account for Altered Calling Criteria documented in the chart
- **Discern Alerts** fire in Interactive View when vital signs are outside normal parameters, presenting required clinician actions
- **"MET Call Criteria Met"** message appears when EWS ≥8 or any single parameter is in E zone
- **Managing Deterioration M-page** provides graphing and trending of vital signs with colour-coded zones
- **Printouts must be in colour only** — never black and white — due to reliance on colour-coded scoring bands
- **CareCompass** integration for vital sign task ordering and completion tracking
- **Altered Calling Criteria** and **Variations to Frequency of Observations** are captured in the digital chart
- **GCS vs AVPU:** The choice between GCS and AVPU documentation affects the EW Score calculation in the digital system

### 10.1 Digital Workflow Summary

1. Take vital signs (device integration or manual)
2. Transfer/enter all 7 parameters into ieMR
3. System calculates EWS automatically
4. If abnormal → Discern Alert fires with required actions
5. If EWS ≥8 or E zone → "MET Call Criteria Met" message
6. Navigate to Managing Deterioration M-page for trending
7. Complete CareCompass task if ordered

---

## 11. Paper Chart Additional Fields

Beyond the 7 scored parameters, the paper charts capture:

- **SMO authorised change to observation frequencies** (Y/N with SMO indicator)
- **MET-MEO Plan in place** (Y/N with MEO indicator)
- **Notification row** (most senior position notified, using notification legend)
- **Changing behaviour/New confusion plan** (Y or N)
- **Interventions row** (letter reference to interventions table)
- **Admission weight and ongoing weight** (kg)
- **Bowels**
- **Clinician initials**

---

## Appendix A: Score Range Summary (Quick Reference)

| Parameter | E | 4 | 3 | 2 | 1 | 0 | 1 | 2 | 3 | 4 | E |
|-----------|---|---|---|---|---|---|---|---|---|---|---|
| **RR** | ≤8 | — | — | — | 9–12 | 13–20 | 21–24 | 25–30 | — | 31–35 | ≥36 |
| **SpO₂ (Std)** | — | ≤84 | — | 85–89 | 90–91 | ≥92 | — | — | — | — | — |
| **SpO₂ (Chronic)** | — | ≤83 | — | 84–85 | 86–87 | ≥88 air / ≥93 O₂ | — | — | — | — | — |
| **O₂ Delivery** | ≥15L/≥60% | >11–14/>50–59% | — | >5–11/>40–50% | 2–5/28–40% | <2/<28% | — | — | — | — | — |
| **SBP** | ≤79 | 80s/≥200 | — | 90s/170–199 | 100s/160s | 110–159 | — | — | — | — | — |
| **HR** | ≤39/≥160 | 140–159 | 130s | 110–129/40s | 100s | 50–99 | — | — | — | — | — |
| **Temp** | — | ≤34 | — | 34.1–35/≥39.5 | 35.1–36/38–38.4 | 36.1–37.9 | — | — | — | — | — |
| **AVPU** | Pain/Unresp | Δ Behaviour | — | — | Voice | Alert | — | — | — | — | — |

---

*Document compiled for REdI (Resuscitation Education Initiative) team educational purposes.*
*Source documents: Queensland Health Q-ADDS forms SW150, SW626, SW1171.*
*Last updated: March 2026*
