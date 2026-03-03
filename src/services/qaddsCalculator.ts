/**
 * Q-ADDS (Queensland Adult Deterioration Detection System) Score Calculator.
 *
 * Implements the Q-ADDS v2 scoring algorithm used across Queensland Health
 * facilities. Each of 7 physiological parameters is scored 0–4 or "E"
 * (Emergency). An "E" on any single parameter triggers an immediate MET call.
 *
 * Thresholds compiled from the official Queensland Health Q-ADDS observation
 * chart and published academic sources:
 * - Flenady et al. (2023) Collegian
 * - Flenady et al. (2020) Resuscitation
 * - ADDS Chart Development Report (ACSQHC)
 * - QAS Adult Deterioration Assessment CPP
 */

import type { VitalSign } from '@/types/patient'
import type {
  QaddsParameter,
  QaddsSubScoreValue,
  QaddsSubScore,
  QaddsSubScores,
  QaddsScore,
  QaddsScoreTrend,
  ClinicalRisk,
  ChartVariant,
  PatientStatus,
} from '@/types/vitals'
import type { QaddsColorCode } from '@/types/news'

// ---------------------------------------------------------------------------
// Threshold Tables
// ---------------------------------------------------------------------------

interface ThresholdBand {
  min: number
  max: number
  score: QaddsSubScoreValue
}

/**
 * Respiratory Rate (breaths/min):
 *   ≤8 → E, 9-12 → 1, 13-20 → 0, 21-24 → 1, 25-30 → 2, 31-35 → 4, ≥36 → E
 */
const RR_THRESHOLDS: ThresholdBand[] = [
  { min: -Infinity, max: 8, score: 'E' },
  { min: 9, max: 12, score: 1 },
  { min: 13, max: 20, score: 0 },
  { min: 21, max: 24, score: 1 },
  { min: 25, max: 30, score: 2 },
  { min: 31, max: 35, score: 4 },
  { min: 36, max: Infinity, score: 'E' },
]

/**
 * SpO₂ — Standard (General Adult):
 *   ≥92 → 0, 90-91 → 1, 85-89 → 2, ≤84 → 4
 * No E zone for SpO₂.
 */
const SPO2_STANDARD_THRESHOLDS: ThresholdBand[] = [
  { min: -Infinity, max: 84, score: 4 },
  { min: 85, max: 89, score: 2 },
  { min: 90, max: 91, score: 1 },
  { min: 92, max: Infinity, score: 0 },
]

/**
 * SpO₂ — Chronic Hypoxia/Hypercapnia:
 *   ≥88 (on air) or ≥93 (on O₂) → 0, 86-87 → 1, 84-85 → 2, ≤83 → 4
 * No E zone for SpO₂.
 *
 * Note: The on-air vs on-O₂ distinction for the "0" zone is handled in the
 * scoring function itself. These thresholds represent the on-air variant;
 * the function adjusts the zero-threshold when supplemental O₂ is detected.
 */
const SPO2_CHRONIC_THRESHOLDS: ThresholdBand[] = [
  { min: -Infinity, max: 83, score: 4 },
  { min: 84, max: 85, score: 2 },
  { min: 86, max: 87, score: 1 },
  { min: 88, max: Infinity, score: 0 },
]

/**
 * O₂ Delivery (L/min):
 *   <2 → 0, 2-5 → 1, >5-11 → 2, >11-14 → 4, ≥15 → E
 * Score 3 does NOT exist for this parameter.
 */
const O2_FLOW_THRESHOLDS: ThresholdBand[] = [
  { min: -Infinity, max: 1.9, score: 0 },
  { min: 2, max: 5, score: 1 },
  { min: 5.1, max: 11, score: 2 },
  { min: 11.1, max: 14, score: 4 },
  { min: 15, max: Infinity, score: 'E' },
]

/**
 * Systolic Blood Pressure (mmHg):
 *   ≤59 → E, 60-79 → E, 80-89 → 4, 90-99 → 2, 100-109 → 1,
 *   110-159 → 0, 160-169 → 1, 170-199 → 2, ≥200 → 4
 */
const SBP_THRESHOLDS: ThresholdBand[] = [
  { min: -Infinity, max: 79, score: 'E' },
  { min: 80, max: 89, score: 4 },
  { min: 90, max: 99, score: 2 },
  { min: 100, max: 109, score: 1 },
  { min: 110, max: 159, score: 0 },
  { min: 160, max: 169, score: 1 },
  { min: 170, max: 199, score: 2 },
  { min: 200, max: Infinity, score: 4 },
]

/**
 * Heart Rate (beats/min):
 *   ≤39 → E, 40-49 → 2, 50-99 → 0, 100-109 → 1, 110-129 → 2,
 *   130-139 → 3, 140-159 → 4, ≥160 → E
 */
const HR_THRESHOLDS: ThresholdBand[] = [
  { min: -Infinity, max: 39, score: 'E' },
  { min: 40, max: 49, score: 2 },
  { min: 50, max: 99, score: 0 },
  { min: 100, max: 109, score: 1 },
  { min: 110, max: 129, score: 2 },
  { min: 130, max: 139, score: 3 },
  { min: 140, max: 159, score: 4 },
  { min: 160, max: Infinity, score: 'E' },
]

/**
 * Temperature (°C):
 *   ≤34.0 → 4, 34.1-35.0 → 2, 35.1-36.0 → 1, 36.1-37.9 → 0,
 *   38.0-38.4 → 1, 38.5-39.4 → 2, ≥39.5 → 2
 * No E zone for temperature.
 */
const TEMP_THRESHOLDS: ThresholdBand[] = [
  { min: -Infinity, max: 34.0, score: 4 },
  { min: 34.1, max: 35.0, score: 2 },
  { min: 35.1, max: 36.0, score: 1 },
  { min: 36.1, max: 37.9, score: 0 },
  { min: 38.0, max: 38.4, score: 1 },
  { min: 38.5, max: 39.4, score: 2 },
  { min: 39.5, max: Infinity, score: 2 },
]

/**
 * CAVPU consciousness scoring:
 *   Alert → 0, Voice → 1, Changing Behaviour → 4, Pain → E, Unresponsive → E
 */
const CONSCIOUSNESS_MAP: Record<string, QaddsSubScoreValue> = {
  Alert: 0,
  A: 0,
  Voice: 1,
  V: 1,
  'Changing Behaviour': 4,
  C: 4,
  Pain: 'E',
  P: 'E',
  Unresponsive: 'E',
  U: 'E',
}

const THRESHOLD_MAP: Record<string, ThresholdBand[]> = {
  rr: RR_THRESHOLDS,
  o2FlowRate: O2_FLOW_THRESHOLDS,
  systolicBP: SBP_THRESHOLDS,
  heartRate: HR_THRESHOLDS,
  temperature: TEMP_THRESHOLDS,
}

// ---------------------------------------------------------------------------
// Scoring Functions
// ---------------------------------------------------------------------------

function lookupScore(thresholds: ThresholdBand[], value: number): QaddsSubScoreValue {
  for (const band of thresholds) {
    if (value >= band.min && value <= band.max) {
      return band.score
    }
  }
  // Fallback: should not be reached if thresholds cover the full range
  return 0
}

function scoreNumericParam(
  parameter: QaddsParameter,
  rawValue: string | number | undefined,
): QaddsSubScore {
  const numVal = typeof rawValue === 'string' ? parseFloat(rawValue) : (rawValue ?? 0)
  const thresholds = THRESHOLD_MAP[parameter]
  if (!thresholds) {
    return { parameter, value: numVal, score: 0 }
  }
  return { parameter, value: numVal, score: lookupScore(thresholds, numVal) }
}

/**
 * Score SpO₂ with support for chart variant.
 *
 * Chronic respiratory patients use lower target ranges (88-92% = score 0).
 * Standard patients use higher targets (≥92 = score 0).
 * No E zone for SpO₂ in any variant.
 */
function scoreSpo2(
  rawValue: string | number | undefined,
  variant: ChartVariant,
): QaddsSubScore {
  const numVal = typeof rawValue === 'string' ? parseFloat(rawValue) : (rawValue ?? 0)

  if (variant === 'chronic_respiratory') {
    // Chronic respiratory patients: 88-92% is ALWAYS score 0 regardless of O₂
    // status. The only difference is a UI-level "Wean O₂" prompt when ≥93% on
    // supplemental O₂ — this does not affect the score.
    return { parameter: 'spo2', value: numVal, score: lookupScore(SPO2_CHRONIC_THRESHOLDS, numVal) }
  }

  return { parameter: 'spo2', value: numVal, score: lookupScore(SPO2_STANDARD_THRESHOLDS, numVal) }
}

function scoreConsciousness(avpu: string | undefined): QaddsSubScore {
  const normalised = (avpu ?? 'Alert').trim()
  const score = CONSCIOUSNESS_MAP[normalised] ?? 0
  return { parameter: 'consciousness', value: normalised, score }
}

/**
 * Derive the clinical risk level from the aggregate score and emergency flags.
 */
function deriveRisk(totalScore: number, hasEmergency: boolean): ClinicalRisk {
  if (hasEmergency || totalScore >= 8) return 'Emergency'
  if (totalScore >= 6) return 'High'
  if (totalScore >= 4) return 'Moderate'
  if (totalScore >= 1) return 'Low'
  return 'Routine'
}

/** Convert a sub-score value to its numeric equivalent for aggregation. E counts as 4. */
function numericScore(s: QaddsSubScoreValue): number {
  return s === 'E' ? 4 : s
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate the full Q-ADDS score for a single set of vital sign observations.
 *
 * @param vitals   - The vital sign observation set to score
 * @param variant  - Chart variant: 'standard' (default) or 'chronic_respiratory'
 */
export function calculateQadds(
  vitals: VitalSign,
  variant: ChartVariant = 'standard',
): QaddsScore {
  const rr = scoreNumericParam('rr', vitals.rr)
  const spo2 = scoreSpo2(vitals.spo2, variant)
  const o2FlowRate = scoreNumericParam('o2FlowRate', vitals.o2FlowRate)
  const systolicBP = scoreNumericParam('systolicBP', vitals.bp_sys)
  const heartRate = scoreNumericParam('heartRate', vitals.hr)
  const temperature = scoreNumericParam('temperature', vitals.temp)
  const consciousness = scoreConsciousness(vitals.avpu)

  const subScores: QaddsSubScores = {
    rr,
    spo2,
    o2FlowRate,
    systolicBP,
    heartRate,
    temperature,
    consciousness,
  }

  const allScores = Object.values(subScores)
  const emergencyParameters = allScores
    .filter((s) => s.score === 'E')
    .map((s) => s.parameter)

  const hasEmergency = emergencyParameters.length > 0 || vitals.nurseConcern === true

  const totalScore = allScores.reduce((sum, s) => sum + numericScore(s.score), 0)
  const clinicalRisk = deriveRisk(totalScore, hasEmergency)

  return {
    totalScore,
    hasEmergency,
    emergencyParameters,
    clinicalRisk,
    subScores,
  }
}

/**
 * Calculate Q-ADDS scores for an array of vitals, returning trend data
 * suitable for plotting score over time.
 *
 * @param vitals  - Array of vital sign observations (typically in chronological order)
 * @param variant - Chart variant: 'standard' (default) or 'chronic_respiratory'
 */
export function calculateQaddsTrend(
  vitals: VitalSign[],
  variant: ChartVariant = 'standard',
): QaddsScoreTrend[] {
  return vitals.map((v) => ({
    datetime: v.datetime,
    score: calculateQadds(v, variant),
  }))
}

/**
 * Get the CSS colour for a given Q-ADDS sub-score value.
 *
 * 0 → white, 1 → yellow, 2 → orange, 3 → red, 4 → red (same), E → purple
 */
export function getScoreColor(score: QaddsSubScoreValue): QaddsColorCode {
  switch (score) {
    case 0:
      return 'white'
    case 1:
      return 'yellow'
    case 2:
      return 'orange'
    case 3:
      return 'red'
    case 4:
      return 'red'
    case 'E':
      return 'purple'
  }
}

/**
 * Get the CSS colour for a clinical risk level.
 */
export function getRiskColor(risk: ClinicalRisk): string {
  switch (risk) {
    case 'Routine':
      return '#ffffff'
    case 'Low':
      return '#fff3cd'
    case 'Moderate':
      return '#ffd699'
    case 'High':
      return '#f8d7da'
    case 'Emergency':
      return '#d5a6e6'
  }
}

/**
 * Get the hex background colour for a Q-ADDS colour code.
 */
export function getColorHex(color: QaddsColorCode): string {
  switch (color) {
    case 'white':
      return '#ffffff'
    case 'yellow':
      return '#fff3cd'
    case 'orange':
      return '#ffd699'
    case 'red':
      return '#f8d7da'
    case 'purple':
      return '#d5a6e6'
  }
}

/**
 * Get the escalation instruction text for a clinical risk level, optionally
 * differentiated by patient status (stable vs deteriorating).
 *
 * When status is not provided, returns a combined default text covering both
 * stable and deteriorating pathways.
 */
export function getEscalationText(risk: ClinicalRisk, status?: PatientStatus): string {
  if (risk === 'Emergency') {
    return 'Initiate MET call. 10 minutely observations. Registrar to ensure SMO notified. Registrar and Nurse escort for transfers.'
  }

  if (status === 'deteriorating') {
    switch (risk) {
      case 'Routine':
        // Score 0 cannot deteriorate by definition; return stable text.
        return '8th hourly observations (minimum). May be modified by SMO for long-stay patients.'
      case 'Low':
        return 'Notify Team Leader. 1 hourly observations. Nurse escort for transfers.'
      case 'Moderate':
        return 'Notify Team Leader. Notify RMO to review within 30 minutes. 1 hourly observations. Nurse escort for transfers. If no review after 30 min \u2192 call Registrar.'
      case 'High':
        return 'Notify Team Leader. Notify Registrar to review within 30 minutes. \u00BD hourly observations. Nurse escort for transfers. If no review after 30 min \u2192 call MET or escalate to SMO.'
    }
  }

  if (status === 'stable') {
    switch (risk) {
      case 'Routine':
        return '8th hourly observations (minimum). May be modified by SMO for long-stay patients.'
      case 'Low':
        return '4th hourly observations (minimum). May be modified by SMO.'
      case 'Moderate':
        return '2nd hourly observations (minimum). May be modified by SMO.'
      case 'High':
        return '1 hourly observations (minimum). May be modified by SMO.'
    }
  }

  // Default (no status provided): combined text
  switch (risk) {
    case 'Routine':
      return '8th hourly observations (minimum). May be modified by SMO for long-stay patients.'
    case 'Low':
      return '4th hourly observations (minimum). May be modified by SMO. If deteriorating: Notify Team Leader. 1 hourly observations. Nurse escort for transfers.'
    case 'Moderate':
      return '2nd hourly observations (minimum). May be modified by SMO. If deteriorating: Notify Team Leader. Notify RMO to review within 30 minutes. 1 hourly observations. Nurse escort for transfers. If no review after 30 min \u2192 call Registrar.'
    case 'High':
      return '1 hourly observations (minimum). May be modified by SMO. If deteriorating: Notify Team Leader. Notify Registrar to review within 30 minutes. \u00BD hourly observations. Nurse escort for transfers. If no review after 30 min \u2192 call MET or escalate to SMO.'
  }
}

/**
 * Validate that all 7 Q-ADDS parameters have values in a vital sign observation.
 *
 * Returns whether the observation is complete and which parameters are missing.
 */
export function validateVitalsComplete(
  vitals: VitalSign,
): { complete: boolean; missing: QaddsParameter[] } {
  const missing: QaddsParameter[] = []

  const rrValue = vitals.rr
  if (rrValue === undefined || String(rrValue).trim() === '') {
    missing.push('rr')
  }
  const spo2Value = vitals.spo2
  if (spo2Value === undefined || String(spo2Value).trim() === '') {
    missing.push('spo2')
  }
  if (vitals.o2FlowRate === undefined || vitals.o2FlowRate === '') {
    missing.push('o2FlowRate')
  }
  const tempValue = vitals.temp
  if (tempValue === undefined || String(tempValue).trim() === '') {
    missing.push('temperature')
  }
  const systolicValue = vitals.bp_sys
  if (systolicValue === undefined || String(systolicValue).trim() === '') {
    missing.push('systolicBP')
  }
  const hrValue = vitals.hr
  if (hrValue === undefined || String(hrValue).trim() === '') {
    missing.push('heartRate')
  }
  const avpuValue = vitals.avpu
  if (avpuValue === undefined || (typeof avpuValue === 'string' && avpuValue.trim() === '')) {
    missing.push('consciousness')
  }

  return { complete: missing.length === 0, missing }
}
